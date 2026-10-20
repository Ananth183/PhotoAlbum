# Rebuilds Images/images.json from the pictures in the Images folder.
# Run after adding, removing or renaming photos:  .\update-images.ps1
$dir = Join-Path $PSScriptRoot "Images"
$ext = '\.(png|jpe?g|gif|webp|avif|bmp)$'

$files = Get-ChildItem -Path $dir -File |
    Where-Object { $_.Name -match $ext } |
    Sort-Object { [regex]::Replace($_.Name, '\d+', { param($m) $m.Value.PadLeft(10, '0') }) } |
    ForEach-Object { $_.Name }

$json = ConvertTo-Json -InputObject @($files)
[System.IO.File]::WriteAllText((Join-Path $dir "images.json"), $json + "`n", (New-Object System.Text.UTF8Encoding $false))
Write-Host "images.json updated with $(@($files).Count) photo(s)."
