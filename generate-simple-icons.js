const fs = require('fs');
const { createCanvas } = require('canvas');

function createIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // グラデーション背景
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#4facfe');
    gradient.addColorStop(0.5, '#00f2fe');
    gradient.addColorStop(1, '#667eea');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // マイクアイコンの描画
    const centerX = size / 2;
    const centerY = size / 2;
    const scale = size / 512;

    ctx.fillStyle = 'white';

    // マイクボディ（シンプルな円形）
    const micRadius = 50 * scale;
    ctx.beginPath();
    ctx.arc(centerX, centerY - 20 * scale, micRadius, 0, Math.PI * 2);
    ctx.fill();

    // TTS テキスト
    ctx.fillStyle = '#4facfe';
    ctx.font = `bold ${40 * scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TTS', centerX, centerY - 20 * scale);

    return canvas.toBuffer('image/png');
}

// アイコンサイズ
const sizes = [144, 192, 512];

sizes.forEach(size => {
    const iconBuffer = createIcon(size);
    fs.writeFileSync(`icons/icon-${size}.png`, iconBuffer);
    console.log(`Generated icon-${size}.png`);
});

console.log('All icons generated successfully!');