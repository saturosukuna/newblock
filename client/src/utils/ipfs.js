
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000'; // Update with your backend URL if needed

// Function to store data in IPFS
export async function storeDataInIPFS(data) {
    try {
        const response = await axios.post(`${API_BASE_URL}/store`, data, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data.cid; // Return the CID
    } catch (error) {
        console.error('Error storing data in IPFS:', error);
        throw new Error('Failed to store data in IPFS');
    }
}

// Function to retrieve data from IPFS
export async function retrieveDataFromIPFS(cid) {
    try {
        const response = await axios.get(`${API_BASE_URL}/retrieve/${cid}`);
        return response.data.data; // Return the retrieved data
    } catch (error) {
        console.error('Error retrieving data from IPFS:', error);
        throw new Error('Failed to retrieve data from IPFS');
    }
}
export async function updateDataInIPFS(cid, newData) {
  try {
      const response = await axios.put(`${API_BASE_URL}/update/${cid}`, newData, {
          headers: { 'Content-Type': 'application/json' }
      });
      
      return response.data.cid; // Return the new CID

  } catch (error) {
      console.error('Error updating data in IPFS:', error);
      throw new Error('Failed to update data in IPFS');
  }
}
