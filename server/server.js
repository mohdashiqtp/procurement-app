const express = require("express");
const { main } = require("./models/index");
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
app.use('/uploads', express.static('uploads'));

//  API
app.use("/api/purchase-order", purchaseOrderRoute);

// Routes
app.use('/api/auth', authRoute);
app.use('/api/protected', protectedRoute);
app.use('/api/items', itemRoute)
app.use('/api/suppliers', supplierRoute)


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