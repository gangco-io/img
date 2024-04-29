const express = require('express');
const multer = require('multer');
const compress_images = require('compress-images');
const fs = require('fs');
const path = require('path');

const app = express();
const OUTPUT_PATH = 'compressed/';

// Multer configuration for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Destination folder for uploaded images
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Preserve the original filename
  }
});
const upload = multer({ storage: storage });

// Route for uploading image and compressing
app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const inputFilePath = req.file.path;
  const outputFileName = req.file.originalname;
  const outputFilePath = OUTPUT_PATH; // Only the directory path


  try {
    await compressImage(inputFilePath, outputFilePath);

    // Delete the original uploaded image
    fs.unlinkSync(inputFilePath);

    // Send a response with the URL of the compressed image
        res.status(200).json({ compressedImageUrl: `/${OUTPUT_PATH}${outputFileName}` });
  } catch (error) {
    console.error('Error compressing image:', error);
    res.status(500).json({ error: 'Failed to compress image' });
  }
});

// Upload multiple images
// Route for uploading images and compressing
app.post('/upload-multi', upload.array('images', 5), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  try {
    const compressedImageUrls = [];

    // Process each uploaded image
    for (const file of req.files) {
      const inputFilePath = file.path;
      const outputFileName = file.originalname;
      const outputFilePath = OUTPUT_PATH; // Full path including filename

      await compressImage(inputFilePath, outputFilePath);

      // Delete the original uploaded image
      fs.unlinkSync(inputFilePath);

      // Construct the URL of the compressed image
      const compressedImageUrl = `/${OUTPUT_PATH}${outputFileName}`; // Use full path including filename
      compressedImageUrls.push(compressedImageUrl);
    }

    // Send a response with the URLs of the compressed images
    res.status(200).json({ compressedImageUrls });
  } catch (error) {
    console.error('Error compressing images:', error);
    res.status(500).json({ error: 'Failed to compress images' });
  }
});


// Function to compress images
async function compressImage(inputFilePath, outputFilePath) {
  return new Promise((resolve, reject) => {
    compress_images(inputFilePath, outputFilePath, { compress_force: false, statistic: true, autoupdate: true }, false,
      { jpg: { engine: 'mozjpeg', command: ['-quality', '60'] } },
      { png: { engine: 'pngquant', command: ['--quality=20-50', '-o'] } },
      { svg: { engine: 'svgo', command: '--multipass' } },
      { gif: { engine: 'gifsicle', command: ['--colors', '64', '--use-col=web'] } }, function (error, completed, statistic) {
        if (error) {
          console.error('Error compressing image:', error);
          reject(error);
        } else {
          console.log('Image compression completed.');
          resolve();
        }
      });
  });
}

// Start server
const PORT = process.env.PORT || 5678;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

