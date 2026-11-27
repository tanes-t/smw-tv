Add-Type -AssemblyName System.Drawing

$resDir = "d:\SynologyDrive2\SynologyDrive\Information Technology\Documents\WebSystem\SMW-TV\android-webview-shell\app\src\main\res"

function Create-SMWIcon([int]$size, [string]$outPath, [bool]$isRound) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    $red = [System.Drawing.Color]::FromArgb(255, 229, 9, 20)      # #E50914
    $white = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)  # White
    $redBrush = New-Object System.Drawing.SolidBrush($red)
    $whiteBrush = New-Object System.Drawing.SolidBrush($white)

    # 1. Background (Circle or Squircle)
    if ($isRound) {
        $g.FillEllipse($redBrush, 1, 1, ($size - 2), ($size - 2))
    } else {
        $r = [int]($size * 0.22)
        $d = $r * 2
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $path.AddArc(1, 1, $d, $d, 180, 90)
        $path.AddArc(($size - 1 - $d), 1, $d, $d, 270, 90)
        $path.AddArc(($size - 1 - $d), ($size - 1 - $d), $d, $d, 0, 90)
        $path.AddArc(1, ($size - 1 - $d), $d, $d, 90, 90)
        $path.CloseFigure()
        $g.FillPath($redBrush, $path)
        $path.Dispose()
    }

    # 2. Text "SMW"
    $fontFam = "Arial"
    $smwFontSize = [float]($size * 0.26)
    $smwFont = New-Object System.Drawing.Font($fontFam, $smwFontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $smwRect = [System.Drawing.RectangleF]::FromLTRB(0, [float]($size * 0.14), [float]$size, [float]($size * 0.58))
    $g.DrawString("SMW", $smwFont, $whiteBrush, $smwRect, $sf)

    # 3. Pill "TV"
    $pillW = [float]($size * 0.38)
    $pillH = [float]($size * 0.18)
    $pillX = [float](($size - $pillW) / 2.0)
    $pillY = [float]($size * 0.62)
    $pillR = [float]($pillH * 0.35)
    $pd = $pillR * 2.0

    $pillPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $pillPath.AddArc($pillX, $pillY, $pd, $pd, 180, 90)
    $pillPath.AddArc(($pillX + $pillW - $pd), $pillY, $pd, $pd, 270, 90)
    $pillPath.AddArc(($pillX + $pillW - $pd), ($pillY + $pillH - $pd), $pd, $pd, 0, 90)
    $pillPath.AddArc($pillX, ($pillY + $pillH - $pd), $pd, $pd, 90, 90)
    $pillPath.CloseFigure()
    $g.FillPath($whiteBrush, $pillPath)
    $pillPath.Dispose()

    # 4. Text "TV" inside Pill
    $tvFontSize = [float]($pillH * 0.65)
    $tvFont = New-Object System.Drawing.Font($fontFam, $tvFontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $pillRect = [System.Drawing.RectangleF]::FromLTRB($pillX, $pillY, ($pillX + $pillW), ($pillY + $pillH))
    $g.DrawString("TV", $tvFont, $redBrush, $pillRect, $sf)

    # Cleanup
    $smwFont.Dispose()
    $tvFont.Dispose()
    $redBrush.Dispose()
    $whiteBrush.Dispose()
    $sf.Dispose()
    $g.Dispose()

    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

function Create-TVBanner([string]$outPath) {
    $w = 640
    $h = 320
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

    # Dark background #0B0D12
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 11, 13, 18))
    $g.FillRectangle($bgBrush, 0, 0, $w, $h)
    $bgBrush.Dispose()

    # Red Squircle Emblem on left
    $red = [System.Drawing.Color]::FromArgb(255, 229, 9, 20)
    $white = [System.Drawing.Color]::White
    $redBrush = New-Object System.Drawing.SolidBrush($red)
    $whiteBrush = New-Object System.Drawing.SolidBrush($white)

    $emblemSize = 160.0
    $emblemX = 75.0
    $emblemY = 80.0
    $r = 36.0
    $d = $r * 2.0
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc($emblemX, $emblemY, $d, $d, 180, 90)
    $path.AddArc(($emblemX + $emblemSize - $d), $emblemY, $d, $d, 270, 90)
    $path.AddArc(($emblemX + $emblemSize - $d), ($emblemY + $emblemSize - $d), $d, $d, 0, 90)
    $path.AddArc($emblemX, ($emblemY + $emblemSize - $d), $d, $d, 90, 90)
    $path.CloseFigure()
    $g.FillPath($redBrush, $path)
    $path.Dispose()

    $fontFam = "Arial"
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    # Emblem "SMW"
    $eSmwFont = New-Object System.Drawing.Font($fontFam, 42.0, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $eSmwRect = [System.Drawing.RectangleF]::FromLTRB($emblemX, [float]($emblemY + 20), [float]($emblemX + $emblemSize), [float]($emblemY + 95))
    $g.DrawString("SMW", $eSmwFont, $whiteBrush, $eSmwRect, $sf)
    $eSmwFont.Dispose()

    # Emblem "TV" pill
    $pW = 66.0
    $pH = 30.0
    $pX = [float]($emblemX + ($emblemSize - $pW) / 2.0)
    $pY = [float]($emblemY + 102.0)
    $pR = 7.0
    $pD = $pR * 2.0
    $pPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $pPath.AddArc($pX, $pY, $pD, $pD, 180, 90)
    $pPath.AddArc(($pX + $pW - $pD), $pY, $pD, $pD, 270, 90)
    $pPath.AddArc(($pX + $pW - $pD), ($pY + $pH - $pD), $pD, $pD, 0, 90)
    $pPath.AddArc($pX, ($pY + $pH - $pD), $pD, $pD, 90, 90)
    $pPath.CloseFigure()
    $g.FillPath($whiteBrush, $pPath)
    $pPath.Dispose()

    $eTvFont = New-Object System.Drawing.Font($fontFam, 18.0, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $eTvRect = [System.Drawing.RectangleF]::FromLTRB($pX, $pY, [float]($pX + $pW), [float]($pY + $pH))
    $g.DrawString("TV", $eTvFont, $redBrush, $eTvRect, $sf)
    $eTvFont.Dispose()

    # Right side: Big "SMW"
    $sfLeft = New-Object System.Drawing.StringFormat
    $sfLeft.LineAlignment = [System.Drawing.StringAlignment]::Center
    $bigSmwFont = New-Object System.Drawing.Font($fontFam, 72.0, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $bigSmwRect = [System.Drawing.RectangleF]::FromLTRB(270.0, 80.0, 460.0, 160.0)
    $g.DrawString("SMW", $bigSmwFont, $whiteBrush, $bigSmwRect, $sfLeft)
    $bigSmwFont.Dispose()

    # Right side: Big "TV" badge
    $bW = 90.0
    $bH = 58.0
    $bX = 460.0
    $bY = 92.0
    $bR = 12.0
    $bD = $bR * 2.0
    $bPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $bPath.AddArc($bX, $bY, $bD, $bD, 180, 90)
    $bPath.AddArc(($bX + $bW - $bD), $bY, $bD, $bD, 270, 90)
    $bPath.AddArc(($bX + $bW - $bD), ($bY + $bH - $bD), $bD, $bD, 0, 90)
    $bPath.AddArc($bX, ($bY + $bH - $bD), $bD, $bD, 90, 90)
    $bPath.CloseFigure()
    $g.FillPath($redBrush, $bPath)
    $bPath.Dispose()

    $bigTvFont = New-Object System.Drawing.Font($fontFam, 34.0, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $bigTvRect = [System.Drawing.RectangleF]::FromLTRB($bX, $bY, [float]($bX + $bW), [float]($bY + $bH))
    $g.DrawString("TV", $bigTvFont, $whiteBrush, $bigTvRect, $sf)
    $bigTvFont.Dispose()

    # Tagline
    $subFont = New-Object System.Drawing.Font($fontFam, 13.0, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $steelBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 148, 163, 184))
    $subRect = [System.Drawing.RectangleF]::FromLTRB(272.0, 172.0, 620.0, 200.0)
    $g.DrawString("SIAM METALWORK • INDUSTRIAL TELEMETRY", $subFont, $steelBrush, $subRect, $sfLeft)
    $subFont.Dispose()
    $steelBrush.Dispose()

    # Live Stream Status
    $greenBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 16, 185, 129))
    $g.FillEllipse($greenBrush, 275, 215, 10, 10)
    $liveFont = New-Object System.Drawing.Font($fontFam, 12.0, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $liveRect = [System.Drawing.RectangleF]::FromLTRB(295.0, 208.0, 620.0, 232.0)
    $g.DrawString("REAL-TIME PRODUCTION STREAM", $liveFont, $greenBrush, $liveRect, $sfLeft)
    $liveFont.Dispose()
    $greenBrush.Dispose()

    $redBrush.Dispose()
    $whiteBrush.Dispose()
    $sf.Dispose()
    $sfLeft.Dispose()
    $g.Dispose()

    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

$densities = @(
    @{ dir = "mipmap-mdpi";    size = 48 },
    @{ dir = "mipmap-hdpi";    size = 72 },
    @{ dir = "mipmap-xhdpi";   size = 96 },
    @{ dir = "mipmap-xxhdpi";  size = 144 },
    @{ dir = "mipmap-xxxhdpi"; size = 192 }
)

foreach ($d in $densities) {
    $folder = Join-Path $resDir $d.dir
    if (-not (Test-Path $folder)) { New-Item -ItemType Directory -Path $folder -Force | Out-Null }

    # 1. Square icon (Squircle)
    $sqPath = Join-Path $folder "ic_launcher.png"
    Create-SMWIcon -size $d.size -outPath $sqPath -isRound $false

    # 2. Round icon (Google TV Launcher uses this!)
    $roundPath = Join-Path $folder "ic_launcher_round.png"
    Create-SMWIcon -size $d.size -outPath $roundPath -isRound $true

    # 3. Foreground icon (Adaptive)
    $fgSize = [int]($d.size * 108 / 48)
    $fgPath = Join-Path $folder "ic_launcher_foreground.png"
    Create-SMWIcon -size $fgSize -outPath $fgPath -isRound $false

    Write-Host "Success: $($d.dir) ($($d.size)px)"
}

# 4. Generate TV Banners
Create-TVBanner -outPath (Join-Path (Join-Path $resDir "drawable-xhdpi") "tv_banner.png")
Create-TVBanner -outPath (Join-Path (Join-Path $resDir "drawable") "tv_banner.png")

Write-Host "All icons & banners regenerated cleanly!"
