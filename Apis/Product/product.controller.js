const Product = require("./product.model");
const passport = require('passport');
const { isValidObjectId } = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { fstat } = require("fs");

//code to store image files in particular folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "ImageUploads/"); // Define the directory where uploaded files will be stored
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); //define file name
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024
  },
})

exports.getProducts = (req, res) => {
  try {
    Product.find()
      .exec()
      .then((products) => {
        res.status(200).json({
          message: "Products fetched!",
          products,
        });
      });
  } catch (error) {
    res.status(500).json({
      message: "Error in fetch products",
      error,
    });
  }
};

exports.getSingleProduct = (req, res) => {
    const productId = req.params.id;
    try {
        Product.findById(productId).exec()
        .then((product) => {
            res.status(200).json({
                message: "Product fetched!",
                product,
              });
        })
        .catch(() => {
            res.status(500).json({
              message: "Error in fetch product",
              error,
            });
          });
    } catch (error) {
        res.status(500).json({
          message: "Error in fetch product",
          error,
        });
      }
}

exports.getProductsByuserId = (req, res) => {
  const userId = req.params.userId;
  try {
    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        message: "userId is not valid",
        Id: productId,
      });
    }

    Product.find({ seller: userId })
      .exec()
      .then((products) => {
        res.status(200).json({
          message: "Products fetched!",
          products,
        });
      })
      .catch(() => {
        res.status(500).json({
          message: "Error in fetch products",
          error,
        });
      });
  } catch (error) {
    res.status(500).json({
      message: "Error in fetch products",
      error,
    });
  }
};

// exports.createProduct = (req, res) => {
//   const userId = req.params.userId;
//   upload.single("productImage")
//   try {
//     const product = new Product({
//       name: req.body.name,
//       price: req.body.price,
//       description: req.body.description,
//       seller: userId,
//     });

//     product
//       .save()
//       .then(() => {
//         res.status(201).json({
//           message: "Product added successfully!",
//           product,
//         });
//       })
//       .catch((err) => {
//         res.status(500).json({
//           message: "Error while creating product",
//           error: err,
//         });
//       });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error in create product",
//       error,
//     });
//   }
// };

exports.createProduct = (req, res, next) => {
  
  //use upload middleware to handle upload of product image
  //except file with field name productimage
  upload.single("productImage")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        message: "Error uploading file",
        error: err
      });
    }

   //create object 
    const product = new Product({
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      seller: req.params.userId,
      productImage: req.file ? `upload/${req.file.filename}` : undefined,
    });

    
    if (req.file) {  //check req.file is exists or not
      product.productImage = `upload/${req.file.filename}`;  //set productimage to path of uploaded file.
    }

      product.save()
        .then((savedProduct) => {
          res.status(201).json({
            message: "Product added successfully",
            product: savedProduct,
          });
        })
        .catch((err) => {
          res.status(500).json({
            message: "Error while creating product",
            error: err,
          });
        });
});
};

//update product Api
exports.editProduct = async (req, res) => {
  const productId = req.params.id;

  if (!isValidObjectId(productId)) {
    return res.status(400).json({
      message: "userId is not valid",
      Id: productId,
    });
  }

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(400).json({
        message: "product not found with this id",
        Id: productId,
      });
    }

    upload.single("productImage")(req, res, async (err) => {
      if(err instanceof multer.MulterError) {
        return res.status(400).json({
          message: "File upload error",
          error: err.message
        });
      } else if (err) {
        return res.status(500).json({
          message: "Unknown error",
          error: err.message
        });
      }

      try {
        // Create update object from form-data
        const updateData = {};

        // Only update fields that are present in the request
        if (req.body.name) updateData.name = req.body.name;
        if (req.body.price) updateData.price = req.body.price;
        if (req.body.description) updateData.description = req.body.description;
        if (req.body.seller) updateData.seller = req.body.seller;

        // Add productImage to update data if a new image was uploaded
        if (req.file) {
          if(product.productImage){
            const oldImagePath = product.productImage.replace('upload/', '');
            const fullPath = `ImageUploads/${oldImagePath}`;

            if(fs.existsSync(fullPath)){
              fs.unlinkSync(fullPath);
            }
          }

          //update with new image path
          updateData.productImage = `upload/${req.file.filename}`;
        }

        const updatedProduct = await Product.findByIdAndUpdate(
          productId,
          { $set: updateData },
          { new: true }
        );
        
        if (updatedProduct) {
          return res.status(200).json({
            message: "product updated!",
            product: updatedProduct,
          });
        } else {
          return res.status(404).json({
            message: "Product not updated",
          });
        } 
      } catch (error) {
        // If there's an error and a new file was uploaded, delete it
        if (req.file) {
          const filePath = `ImageUploads/${req.file.filename}`;
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }

        return res.status(500).json({
          message: "Error updating product",
          error: error.message
        });
      }
    })
  } catch (error) {
    res.status(500).json({
      message: "Error in edit Product",
      error,
    });
  }
};

exports.deleteProduct = async (req, res) => {
  const productId = req.params.id;

  if (!isValidObjectId(productId)) {
    return res.status(400).json({
      message: "userId is not valid",
      Id: productId,
    });
  }

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(400).json({
        message: "product not found with this id",
        Id: productId,
      });
    }

     // Remove image from ImageUploads folder once its particular product deleted
     if (product.productImage) {
        const oldImagePath = product.productImage.replace('upload/', '');
        const fullPath = `ImageUploads/${oldImagePath}`;

        if(fs.existsSync(fullPath)){
          fs.unlinkSync(fullPath);
        }
    }

    await Product.findByIdAndDelete(productId);

    res.status(200).json({
      message: "Product deleted successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error in delete Product",
      error,
    });
  }
};
