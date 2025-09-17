#!/usr/bin/env python3
"""
Simple icon generator for Text-to-Speech PWA
Creates basic placeholder icons with gradient background and TTS text
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

import os

def create_simple_icon_svg(size):
    """Create a simple SVG icon"""
    svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4facfe;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#00f2fe;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#667eea;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background with rounded corners -->
  <rect width="{size}" height="{size}" rx="{size * 0.22}" ry="{size * 0.22}" fill="url(#gradient)"/>

  <!-- Microphone icon -->
  <g transform="translate({size/2}, {size/2})">
    <!-- Microphone body -->
    <rect x="-{size * 0.06}" y="-{size * 0.12}" width="{size * 0.12}" height="{size * 0.15}" rx="{size * 0.06}" fill="white"/>

    <!-- Microphone stand -->
    <line x1="0" y1="{size * 0.03}" x2="0" y2="{size * 0.12}" stroke="white" stroke-width="{size * 0.01}" stroke-linecap="round"/>

    <!-- Microphone base -->
    <line x1="-{size * 0.05}" y1="{size * 0.12}" x2="{size * 0.05}" y2="{size * 0.12}" stroke="white" stroke-width="{size * 0.015}" stroke-linecap="round"/>

    <!-- Sound waves -->
    <path d="M {size * 0.08} -{size * 0.04} Q {size * 0.15} -{size * 0.08} {size * 0.15} 0 Q {size * 0.15} {size * 0.08} {size * 0.08} {size * 0.04}"
          stroke="white" stroke-width="{size * 0.008}" fill="none" opacity="0.8"/>

    <path d="M {size * 0.12} -{size * 0.06} Q {size * 0.22} -{size * 0.12} {size * 0.22} 0 Q {size * 0.22} {size * 0.12} {size * 0.12} {size * 0.06}"
          stroke="white" stroke-width="{size * 0.006}" fill="none" opacity="0.6"/>
  </g>
</svg>'''
    return svg_content

def create_basic_icon_html(size):
    """Create an HTML canvas-based icon generator"""
    html_content = f'''<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Icon Generator {size}x{size}</title>
</head>
<body>
    <canvas id="canvas" width="{size}" height="{size}" style="border: 1px solid #ccc;"></canvas>
    <br>
    <a id="download" download="icon-{size}.png">Download icon-{size}.png</a>

    <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const size = {size};

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#4facfe');
        gradient.addColorStop(0.5, '#00f2fe');
        gradient.addColorStop(1, '#667eea');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        // Icon design
        const centerX = size / 2;
        const centerY = size / 2;
        const scale = size / 200;

        // Microphone
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3 * scale;

        // Mic body
        ctx.beginPath();
        ctx.roundRect(centerX - 15 * scale, centerY - 30 * scale, 30 * scale, 40 * scale, 15 * scale);
        ctx.fill();

        // Mic stand
        ctx.beginPath();
        ctx.moveTo(centerX, centerY + 10 * scale);
        ctx.lineTo(centerX, centerY + 30 * scale);
        ctx.stroke();

        // Mic base
        ctx.beginPath();
        ctx.moveTo(centerX - 15 * scale, centerY + 30 * scale);
        ctx.lineTo(centerX + 15 * scale, centerY + 30 * scale);
        ctx.stroke();

        // TTS Text
        ctx.fillStyle = '#4facfe';
        ctx.font = `bold ${{Math.max(16, size * 0.08)}}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TTS', centerX, centerY + 60 * scale);

        // Setup download
        canvas.toBlob(function(blob) {{
            const url = URL.createObjectURL(blob);
            document.getElementById('download').href = url;
        }});
    </script>
</body>
</html>'''
    return html_content

def create_icons():
    """Create icons using available methods"""
    sizes = [144, 192, 512]

    # Create icons directory
    os.makedirs('icons', exist_ok=True)

    created_icons = []

    for size in sizes:
        # Try to create SVG icon
        try:
            svg_content = create_simple_icon_svg(size)
            svg_path = f'icons/icon-{size}.svg'
            with open(svg_path, 'w', encoding='utf-8') as f:
                f.write(svg_content)
            created_icons.append(f'SVG: {svg_path}')
        except Exception as e:
            print(f"Failed to create SVG for {size}x{size}: {e}")

        # Create HTML generator
        try:
            html_content = create_basic_icon_html(size)
            html_path = f'icons/generate-icon-{size}.html'
            with open(html_path, 'w', encoding='utf-8') as f:
                f.write(html_content)
            created_icons.append(f'HTML Generator: {html_path}')
        except Exception as e:
            print(f"Failed to create HTML generator for {size}x{size}: {e}")

    return created_icons

if __name__ == '__main__':
    print("Creating PWA icons...")

    if not PIL_AVAILABLE:
        print("PIL/Pillow not available, creating SVG and HTML generators instead")

    created = create_icons()

    print("\\nCreated files:")
    for item in created:
        print(f"  - {item}")

    print("\\nTo generate PNG icons:")
    print("1. Open the HTML files in a browser")
    print("2. Click the download links to save PNG files")
    print("3. Move the PNG files to the icons/ directory")
    print("\\nOr install Pillow: pip install Pillow")