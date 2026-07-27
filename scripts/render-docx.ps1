param(
  [Parameter(Mandatory = $true)]
  [string]$InputPath,

  [string]$OutputDir = (Join-Path (Get-Location) 'rendered-docx')
)

$ErrorActionPreference = 'Stop'

function Find-Executable {
  param(
    [string]$Name,
    [string[]]$Candidates
  )

  $command = Get-Command $Name -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  foreach ($candidate in $Candidates) {
    if (Test-Path -LiteralPath $candidate) {
      return $candidate
    }
  }

  throw "No se encontro $Name. Instala LibreOffice y Poppler antes de continuar."
}

$input = (Resolve-Path -LiteralPath $InputPath).Path
$output = [IO.Path]::GetFullPath($OutputDir)
[IO.Directory]::CreateDirectory($output) | Out-Null

$soffice = Find-Executable 'soffice.com' @(
  'C:\Program Files\LibreOffice\program\soffice.com'
)

$pdftoppm = Find-Executable 'pdftoppm.exe' @(
  (Get-ChildItem 'C:\Users\*\AppData\Local\Microsoft\WinGet\Packages\oschwartz10612.Poppler_*\poppler-*\Library\bin\pdftoppm.exe' -ErrorAction SilentlyContinue |
    Select-Object -First 1 -ExpandProperty FullName)
)

$libreOfficePython = Get-ChildItem (Split-Path $soffice) -Directory -Filter 'python-core-*' -ErrorAction SilentlyContinue |
  Sort-Object Name -Descending |
  Select-Object -First 1 -ExpandProperty FullName

$tempRoot = Join-Path $env:TEMP ("techretail-docx-" + [guid]::NewGuid())
$profile = Join-Path $tempRoot 'lo-profile'
$normalized = Join-Path $tempRoot 'documento.docx'
$previousPythonHome = $env:PYTHONHOME
[IO.Directory]::CreateDirectory($profile) | Out-Null

try {
  Add-Type -AssemblyName System.IO.Compression
  Add-Type -AssemblyName System.IO.Compression.FileSystem

  $sourceZip = [IO.Compression.ZipFile]::OpenRead($input)
  $normalizedStream = [IO.File]::Open($normalized, [IO.FileMode]::CreateNew)
  $normalizedZip = [IO.Compression.ZipArchive]::new(
    $normalizedStream,
    [IO.Compression.ZipArchiveMode]::Create,
    $false
  )

  try {
    foreach ($entry in $sourceZip.Entries) {
      $newEntry = $normalizedZip.CreateEntry(
        $entry.FullName.Replace('\', '/'),
        [IO.Compression.CompressionLevel]::Optimal
      )
      $source = $entry.Open()
      $destination = $newEntry.Open()
      try {
        $source.CopyTo($destination)
      } finally {
        $source.Dispose()
        $destination.Dispose()
      }
    }
  } finally {
    $normalizedZip.Dispose()
    $normalizedStream.Dispose()
    $sourceZip.Dispose()
  }

  $profileUri = 'file:///' + ($profile -replace '\\', '/')
  $env:SAL_DISABLE_OPENCL = '1'
  if ($libreOfficePython) { $env:PYTHONHOME = $libreOfficePython }

  & $soffice `
    "-env:UserInstallation=$profileUri" `
    --headless `
    --nologo `
    --nodefault `
    --nofirststartwizard `
    --norestore `
    --convert-to 'pdf:writer_pdf_Export' `
    --outdir $output `
    $normalized

  if ($LASTEXITCODE -ne 0) {
    throw "LibreOffice termino con codigo $LASTEXITCODE."
  }

  $generatedPdf = Join-Path $output 'documento.pdf'
  if (-not (Test-Path -LiteralPath $generatedPdf)) {
    throw 'LibreOffice no genero el PDF.'
  }

  $finalPdf = Join-Path $output (([IO.Path]::GetFileNameWithoutExtension($input)) + '.pdf')
  Move-Item -LiteralPath $generatedPdf -Destination $finalPdf -Force

  Get-ChildItem -LiteralPath $output -Filter 'page-*.png' -File -ErrorAction SilentlyContinue |
    Remove-Item -Force

  & $pdftoppm -png -r 144 $finalPdf (Join-Path $output 'page')
  if ($LASTEXITCODE -ne 0) {
    throw "Poppler termino con codigo $LASTEXITCODE."
  }

  $pages = @(Get-ChildItem -LiteralPath $output -Filter 'page-*.png' -File)
  if ($pages.Count -eq 0) {
    throw 'Poppler no genero imagenes.'
  }

  Write-Host "PDF: $finalPdf"
  Write-Host "Paginas PNG: $($pages.Count)"
} finally {
  $env:PYTHONHOME = $previousPythonHome
  $resolvedTemp = [IO.Path]::GetFullPath($tempRoot)
  $resolvedBase = [IO.Path]::GetFullPath($env:TEMP)
  if ($resolvedTemp.StartsWith($resolvedBase, [StringComparison]::OrdinalIgnoreCase)) {
    Remove-Item -LiteralPath $resolvedTemp -Recurse -Force -ErrorAction SilentlyContinue
  }
}
