const express = require("express");
const { main } = require("./models/index");
// const { authMiddleware } = require('./middlewares/auth');
const cors = require("cors");
const purchaseOrderRoute = require("./routes/purchaseOrderRoutes"); 
const authRoute = require("./routes/authRoutes");
const protectedRoute = require("./routes/purchaseOrderRoutes")
const itemRoute = require("./routes/itemRoutes")
const supplierRoute = require("./routes/supplierRoutes")


const app = express();
const PORT = process.env.PORT || 4000;

main();

app.use(express.json());
app.use(cors());

// Sales API
app.use("/api/purchase-order", purchaseOrderRoute);

// Routes
app.use('/api/auth', authRoute);
app.use('/api/protected', protectedRoute);
app.use('/api/items', itemRoute)
app.use('/api/suppliers', supplierRoute)




// // Registration route
// app.post("/api/register", async (req, res) => {
//   try {
//     const { firstName, lastName, email, password, phoneNumber, imageUrl } = req.body;
    
//     console.log('Registration attempt for:', email);

//     if (!email || !password) {
//       return res.status(400).json({ error: 'Email and password are required' });
//     }

//     // Check if user already exists
//     const existingUser = await User.findOne({ email: email.toLowerCase() });
//     if (existingUser) {
//       return res.status(409).json({ error: 'User already exists' });
//     }

//     const user = new User({
//       firstName,
//       lastName,
//       email: email.toLowerCase(), // Ensure email is lowercase
//       password, // Store password as plain text (not recommended for production!)
//       phoneNumber,
//       imageUrl
//     });

//     await user.save();
//     console.log('User saved successfully');

//     // Create JWT token
//     const token = jwt.sign(
//       {
//         userId: user._id,
//         email: user.email
//       },
//       JWT_SECRET,
//       { expiresIn: '24h' }
//     );

//     res.status(201).json({
//       token,
//       user: {
//         _id: user._id,
//         email: user.email,
//         firstName: user.firstName,
//         lastName: user.lastName
//       }
//     });
//   } catch (error) {
//     console.error('Registration error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// // Login route
// app.post("/api/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;
    
//     console.log('Login attempt for:', email);

//     if (!email || !password) {
//       return res.status(400).json({ error: 'Email and password are required' });
//     }

//     // Find user
//     const user = await User.findOne({ email: email.toLowerCase() });
    
//     if (!user) {
//       console.log('No user found with email:', email);
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     console.log('User found, comparing passwords');
    
//     // Compare password (plain text comparison)
//     const isMatch = (password === user.password);
//     console.log('Password comparison result:', isMatch);

//     if (!isMatch) {
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     // Create JWT token
//     const token = jwt.sign(
//       { userId: user._id, email: user.email },
//       JWT_SECRET,
//       { expiresIn: '24h' }
//     );

//     res.json({
//       token,
//       user: {
//         _id: user._id,
//         email: user.email,
//         firstName: user.firstName,
//         lastName: user.lastName
//       }
//     });
//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// // Protected route example
// app.get("/api/profile", auth, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.userId).select('-password');
//     res.json(user);
//   } catch (error) {
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

app.get("/",  async (req, res) => {
  try {
    res.json({ message : 'Hi your on backend' })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;