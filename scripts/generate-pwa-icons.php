<?php
/**
 * PWA Icon Generator Script
 * 
 * Generates placeholder PWA icons using PHP GD Library
 * Run from command line: php scripts/generate-pwa-icons.php
 */

$sizes = [
    'icon-192.png' => 192,
    'icon-192-maskable.png' => 192,
    'icon-512.png' => 512,
    'icon-512-maskable.png' => 512,
    'screenshot-540.png' => [540, 720],
    'screenshot-1280.png' => [1280, 720],
];

$outputDir = __DIR__ . '/../public/icons';

// Create icons directory if it doesn't exist
if (!is_dir($outputDir)) {
    mkdir($outputDir, 0755, true);
    echo "Created directory: $outputDir\n";
}

foreach ($sizes as $filename => $size) {
    $filePath = $outputDir . '/' . $filename;
    
    if (is_array($size)) {
        $width = $size[0];
        $height = $size[1];
    } else {
        $width = $height = $size;
    }
    
    // Create image
    $image = imagecreatetruecolor($width, $height);
    
    // Define colors
    $brandColor = imagecolorallocate($image, 75, 85, 99); // #4B5563
    $lightColor = imagecolorallocate($image, 240, 240, 240); // Light background
    $white = imagecolorallocate($image, 255, 255, 255);
    
    // Fill background with light color
    imagefilledrectangle($image, 0, 0, $width, $height, $lightColor);
    
    // Draw brand-colored rounded rectangle (simplified as a square)
    $padding = $width > 512 ? 100 : ($width > 192 ? 40 : 20);
    imagefilledrectangle(
        $image,
        $padding,
        $padding,
        $width - $padding,
        $height - $padding,
        $brandColor
    );
    
    // Draw a simple "D" initial for DataMarket in the center
    $fontSize = $width / 3;
    $textColor = $white;
    
    // Use built-in fonts for simplicity (GD doesn't support TTF without compilation)
    // We'll draw simple shapes instead
    
    // Draw a circle or simple shape in the center
    $centerX = $width / 2;
    $centerY = $height / 2;
    $radius = $width / 6;
    
    imagefilledarc(
        $image,
        (int)$centerX,
        (int)$centerY,
        (int)($radius * 2),
        (int)($radius * 2),
        0,
        360,
        $white,
        IMG_ARC_PIE
    );
    
    // Save image
    if (imagepng($image, $filePath)) {
        echo "✓ Generated: $filename ($width x $height)\n";
        imagedestroy($image);
    } else {
        echo "✗ Failed to generate: $filename\n";
    }
}

echo "\n✓ All PWA icons generated successfully in $outputDir\n";
echo "Update manifest.json and app.blade.php with your real icons when ready.\n";
