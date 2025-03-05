import express from 'express';

import { create } from 'ipfs-http-client';
import cors from 'cors';

const app = express();
const port = 5000;
const baseUrl = `http://localhost:${port}`;

// Middleware
app.use(cors());
//app.use(express.json());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));


// Initialize IPFS client
const ipfs = create({ url: 'http://127.0.0.1:5001' });

// In-memory storage for IPFS CIDs (for demonstration purposes)
const ipfsStorage = {};

// Store data in IPFS
app.post('/store', async (req, res) => {
  try {
    const data = JSON.stringify(req.body);
    const { cid } = await ipfs.add(data);
    ipfsStorage[cid.toString()] = req.body; // Store data in memory
    res.status(200).json({ cid: cid.toString(), url: `${baseUrl}/retrieve/${cid.toString()}` });
  } catch (error) {
    console.error('Error storing data in IPFS:', error);
    res.status(500).json({ error: 'Failed to store data in IPFS' });
  }
});

// Retrieve data from IPFS
app.get('/retrieve/:cid', async (req, res) => {
  try {
    const cid = req.params.cid;
    if (!ipfsStorage[cid]) {
      return res.status(404).json({ error: 'Data not found' });
    }
    res.status(200).json({ data: ipfsStorage[cid] });
  } catch (error) {
    console.error('Error retrieving data from IPFS:', error);
    res.status(500).json({ error: 'Failed to retrieve data from IPFS' });
  }
});

// Update data in IPFS
app.put('/update/:cid', async (req, res) => {
  try {
    const cid = req.params.cid;
    const newData = req.body;
    if (!ipfsStorage[cid]) {
      return res.status(404).json({ error: 'Data not found' });
    }
    ipfsStorage[cid] = newData; // Update data in memory
    res.status(200).json({ cid, url: `${baseUrl}/retrieve/${cid}` });
  } catch (error) {
    console.error('Error updating data in IPFS:', error);
    res.status(500).json({ error: 'Failed to update data in IPFS' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on ${baseUrl}`);
});