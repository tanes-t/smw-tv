param()

Add-Type -AssemblyName System.Drawing

$resDir = "d:\SynologyDrive2\SynologyDrive\Information Technology\Documents\WebSystem\SMW-TV\android-webview-shell\app\src\main\res"

# Function to draw beautiful squircle or round SMW TV Icon
function Generate-SMWIcon {
    param(
        [int]$size,
        [string]$outputPath,
        [bool]$isRound = $false,
        [bool]$isForegroundOnly = $false
    )

    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $g.Clear([System.Drawing.Color]::Transparent)

    $redColor = [System.Drawing.Color]::FromArgb(255, 229, 9, 20)      # #E50914 Signature Red
    $whiteColor = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)  # Pure White

    if (-not $isForegroundOnly) {
        $redBrush = New-Object System.Drawing.SolidBrush($redColor)
        if ($isRound) {
            # Circular icon
            $g.FillEllipse($redBrush, 2, 2, $size - 4, $size - 4)
        } else {
            # Squircle / Rounded Rectangle
            $cornerR = [math]::Round($size * 0.22)
            $path = New-Object System.Drawing.Drawing2D.GraphicsPath
            $d = $cornerR * 2
            $rect = New-Object System.Drawing.Rectangle(2, 2, $size - 4, $size - 4)
            $path.AddArc($rect.X, $rect.Y, $d, $d, 180, 90)
            $path.AddArc($rect.Right - $d, $rect.Y, $d, $d, 270, 90)
            $path.AddArc($rect.Right - $d, $rect.Bottom - $d, $d, $d, 0, 90)
            $path.AddArc($rect.X, $rect.Bottom - $d, $d, $d, 90, 90)
            $path.CloseFigure()
            $g.FillPath($redBrush, $path)
            $path.Dispose()
        }
        $redBrush.Dispose()
    }

    # Draw "SMW" text
    # Size-proportional font
    $fontScale = if ($isForegroundOnly) { 0.28 } else { 0.30 }
    $fontSize = [math]::Round($size * $fontScale)
    $fontFamily = "Arial"
    try {
        $testFont = New-Object System.Drawing.Font("Outfit", $fontSize, [System.Drawing.FontStyle]::Bold)
        if ($testFont.FontFamily.Name -eq "Outfit") { $fontFamily = "Outfit" }
        $testFont.Dispose()
    } catch {}

    $smwFont = New-Object System.Drawing.Font($fontFamily, $fontSize, [System.Drawing.FontStyle]::Bold)
    $whiteBrush = New-Object System.Drawing.SolidBrush($whiteColor)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $smwYOffset = if ($isForegroundOnly) { [math]::Round($size * 0.36) } else { [math]::Round($size * 0.38) }
    $smwRect = New-Object System.Drawing.RectangleF(0, 0, $size, $smwYOffset * 2)
    $g.DrawString("SMW", $smwFont, $whiteBrush, $smwRect, $sf)

    # Draw "TV" Badge Pill
    $pillW = [math]::Round($size * 0.36)
    $pillH = [math]::Round($size * 0.17)
    $pillX = [math]::Round(($size - $pillW) / 2)
    $pillY = [math]::Round($size * 0.62)
    $pillR = [math]::Round($pillH * 0.35)

    $pillPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $pd = $pillR * 2
    $pillPath.AddArc($pillX, $pillY, $pd, $pd, 180, 90)
    $pillPath.AddArc($pillX + $pillW - $pd, $pillY, $pd, $pd, 270, 90)
    $pillPath.AddArc($pillX + $pillW - $pd, $pillY + $pillH - $pd, $pd, $pd, 0, 90)
    $pillPath.AddArc($pillX, $pillY + $pillH - $pd, $pd, $pd, 90, 90)
    $pillPath.CloseFigure()
    $g.FillPath($whiteBrush, $pillPath)
    $pillPath.Dispose()

    # Draw "TV" text inside White Pill
    $tvFontSize = [math]::Round($pillH * 0.62)
    $tvFont = New-Object System.Drawing.Font($fontFamily, $tvFontSize, [System.Drawing.FontStyle]::Bold)
    $redBrush = New-Object System.Drawing.SolidBrush($redColor)
    $pillRect = New-Object System.Drawing.RectangleF($pillX, $pillY, $pillW, $pillH)
    $g.DrawString("TV", $tvFont, $redBrush, $pillRect, $sf)

    # Cleanup
    $smwFont.Dispose()
    $tvFont.Dispose()
    $whiteBrush.Dispose()
    $redBrush.Dispose()
    $sf.Dispose()
    $g.Dispose()

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

# Function to draw TV Banner (640x320)
function Generate-TVBanner {
    param([string]$outputPath)
    $w = 640
    $h = 320
    $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # Dark background #0B0D12
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 11, 13, 18))
    $g.FillRectangle($bgBrush, 0, 0, $w, $h)
    $bgBrush.Dispose()

    # Draw red squircle emblem on left
    $emblemSize = 160
    $emblemX = 75
    $emblemY = 80
    $cornerR = 36
    $d = $cornerR * 2
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc($emblemX, $emblemY, $d, $d, 180, 90)
    $path.AddArc($emblemX + $emblemSize - $d, $emblemY, $d, $d, 270, 90)
    $path.AddArc($emblemX + $emblemSize - $d, $emblemY + $emblemSize - $d, $d, $d, 0, 90)
    $path.AddArc($emblemX, $emblemY + $emblemSize - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    $redBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 229, 9, 20))
    $g.FillPath($redBrush, $path)
    $path.Dispose()

    # Text inside emblem
    $fontFamily = "Arial"
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)

    $embSmwFont = New-Object System.Drawing.Font($fontFamily, 44, [System.Drawing.FontStyle]::Bold)
    $embSmwRect = New-Object System.Drawing.RectangleF($emblemX, $emblemY + 12, $emblemSize, 80)
    $g.DrawString("SMW", $embSmwFont, $whiteBrush, $embSmwRect, $sf)
    $embSmwFont.Dispose()

    # Pill inside emblem
    $pW = 60
    $pH = 28
    $pX = $emblemX + ($emblemSize - $pW) / 2
    $pY = $emblemY + 104
    $g.FillRectangle($whiteBrush, $pX, $pY, $pW, $pH)

    $embTvFont = New-Object System.Drawing.Font($fontFamily, 16, [System.Drawing.FontStyle]::Bold)
    $embTvRect = New-Object System.Drawing.RectangleF($pX, $pY, $pW, $pH)
    $g.DrawString("TV", $embTvFont, $redBrush, $embTvRect, $sf)
    $embTvFont.Dispose()

    # Right side: Large "SMW"
    $smwFont = New-Object System.Drawing.Font($fontFamily, 68, [System.Drawing.FontStyle]::Bold)
    $g.DrawString("SMW", $smwFont, $whiteBrush, 275, 80)
    $smwFont.Dispose()

    # Right side: "TV" red badge
    $badgeW = 90
    $badgeH = 58
    $badgeX = 470
    $badgeY = 100
    $badgeCorner = 12
    $bd = $badgeCorner * 2
    $bPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $bPath.AddArc($badgeX, $badgeY, $bd, $bd, 180, 90)
    $bPath.AddArc($badgeX + $badgeW - $bd, $badgeY, $bd, $bd, 270, 90)
    $bPath.AddArc($badgeX + $badgeW - $bd, $badgeY + $badgeH - $bd, $bd, $bd, 0, 90)
    $bPath.AddArc($badgeX, $badgeY + $badgeH - $bd, $bd, $bd, 90, 90)
    $bPath.CloseFigure()
    $g.FillPath($redBrush, $bPath)
    $bPath.Dispose()

    $tvBadgeFont = New-Object System.Drawing.Font($fontFamily, 36, [System.Drawing.FontStyle]::Bold)
    $tvBadgeRect = New-Object System.Drawing.RectangleF($badgeX, $badgeY, $badgeW, $badgeH)
    $g.DrawString("TV", $tvBadgeFont, $whiteBrush, $tvBadgeRect, $sf)
    $tvBadgeFont.Dispose()

    # Subtitle text
    $subFont = New-Object System.Drawing.Font($fontFamily, 12, [System.Drawing.FontStyle]::Bold)
    $steelBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 148, 163, 184))
    $g.DrawString("SIAM METALWORK • INDUSTRIAL TELEMETRY", $subFont, $steelBrush, 278, 182)
    $subFont.Dispose()
    $steelBrush.Dispose()

    # Live pill
    $greenBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 16, 185, 129))
    $g.FillEllipse($greenBrush, 280, 215, 10, 10)
    $liveFont = New-Object System.Drawing.Font($fontFamily, 11, [System.Drawing.FontStyle]::Bold)
    $g.DrawString("REAL-TIME PRODUCTION STREAM", $liveFont, $greenBrush, 298, 213)
    $liveFont.Dispose()
    $greenBrush.Dispose()

    $whiteBrush.Dispose()
    $redBrush.Dispose()
    $sf.Dispose()
    $g.Dispose()

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
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
    Generate-SMWIcon -size $d.size -outputPath $sqPath -isRound $false

    # 2. Round icon (Google TV Launcher uses this!)
    $roundPath = Join-Path $folder "ic_launcher_round.png"
    Generate-SMWIcon -size $d.size -outputPath $roundPath -isRound $true

    # 3. Foreground icon (Adaptive)
    $fgSize = [math]::Round($d.size * 108 / 48)
    $fgPath = Join-Path $folder "ic_launcher_foreground.png"
    Generate-SMWIcon -size $fgSize -outputPath $fgPath -isForegroundOnly $true

    Write-Host "Generated $($d.dir): $($d.size)px"
}

# 4. Generate TV Banner
$xhdpiBanner = Join-Path (Join-Path $resDir "drawable-xhdpi") "tv_banner.png"
Generate-TVBanner -outputPath $xhdpiBanner
$defBanner = Join-Path (Join-Path $resDir "drawable") "tv_banner.png"
Generate-TVBanner -outputPath $defBanner

Write-Host "All icons & banners rendered with System.Drawing successfully!"
