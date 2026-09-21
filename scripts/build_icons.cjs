const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const rawIconPath = 'C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\7a27c0ec-27c2-4876-9e58-e5659d62fc63\\asi_monitor_app_icon_1789987702620.jpg';

async function generateAllIcons() {
  console.log('Generating custom ASI Monitor icons from raw asset...');

  // 1. Extract the squircle: minX: 171, maxX: 852, minY: 171, maxY: 852 -> 682x682
  const extractedBuffer = await sharp(rawIconPath)
    .extract({ left: 171, top: 171, width: 682, height: 682 })
    .resize(512, 512)
    .toBuffer();

  // Create rounded squircle mask for 512x512
  const squircleMask = Buffer.from(
    `<svg width="512" height="512"><rect x="0" y="0" width="512" height="512" rx="105" ry="105" fill="#ffffff"/></svg>`
  );

  const circularMask = Buffer.from(
    `<svg width="512" height="512"><circle cx="256" cy="256" r="256" fill="#ffffff"/></svg>`
  );

  // Masked 512x512 squircle PNG
  const squircleIcon512 = await sharp(extractedBuffer)
    .composite([{ input: squircleMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // Circular 512x512 PNG
  const circularIcon512 = await sharp(extractedBuffer)
    .composite([{ input: circularMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // Foreground: centered on transparent canvas for Android Adaptive Icon
  // For adaptive foreground, the 512x512 icon is scaled down to ~72% (368x368) and centered on 512x512
  const foregroundScaled = await sharp(extractedBuffer)
    .resize(360, 360, { fit: 'inside' })
    .composite([{ input: Buffer.from(`<svg width="360" height="360"><rect x="0" y="0" width="360" height="360" rx="72" ry="72" fill="#ffffff"/></svg>`), blend: 'dest-in' }])
    .toBuffer();

  const foreground512 = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: foregroundScaled, gravity: 'center' }])
    .png()
    .toBuffer();

  // Save public web assets
  const publicDir = path.join(__dirname, '..', 'public');
  await sharp(squircleIcon512).resize(512, 512).toFile(path.join(publicDir, 'app-icon.png'));
  await sharp(squircleIcon512).resize(512, 512).toFile(path.join(publicDir, 'logo.png'));
  await sharp(squircleIcon512).resize(192, 192).toFile(path.join(publicDir, 'favicon.png'));
  await sharp(squircleIcon512).resize(32, 32).toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('✓ Public web icons generated.');

  // Android mipmap sizes
  const mipmaps = [
    { dir: 'mipmap-mdpi', size: 48, fgSize: 108 },
    { dir: 'mipmap-hdpi', size: 72, fgSize: 162 },
    { dir: 'mipmap-xhdpi', size: 96, fgSize: 216 },
    { dir: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
    { dir: 'mipmap-xxxhdpi', size: 192, fgSize: 432 }
  ];

  const resBase = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

  for (const m of mipmaps) {
    const targetDir = path.join(resBase, m.dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // ic_launcher.png (squircle)
    await sharp(squircleIcon512)
      .resize(m.size, m.size)
      .toFile(path.join(targetDir, 'ic_launcher.png'));

    // ic_launcher_round.png (circle)
    await sharp(circularIcon512)
      .resize(m.size, m.size)
      .toFile(path.join(targetDir, 'ic_launcher_round.png'));

    // ic_launcher_foreground.png (adaptive foreground)
    await sharp(foreground512)
      .resize(m.fgSize, m.fgSize)
      .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));

    console.log(`✓ Android ${m.dir} icons created (size: ${m.size}px, fg: ${m.fgSize}px)`);
  }

  console.log('All custom ASI Monitor icons generated successfully!');
}

generateAllIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
