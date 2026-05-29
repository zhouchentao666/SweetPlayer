const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// 创建 256x256 的图标
const size = 256;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');

// 透明背景
ctx.clearRect(0, 0, size, size);

// 绘制圆形背景
ctx.beginPath();
ctx.arc(size/2, size/2, size/2 - 8, 0, Math.PI * 2);
ctx.fillStyle = '#333333';
ctx.fill();

// 绘制音乐符号 ♪
ctx.font = 'bold 180px Arial, sans-serif';
ctx.fillStyle = '#ffffff';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('♪', size/2, size/2 + 10);

// 保存为 PNG
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(path.join(__dirname, 'icon.png'), buffer);

console.log('图标已创建: icon.png');
