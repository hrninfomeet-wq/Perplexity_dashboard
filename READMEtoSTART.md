Here is the complete, step-by-step guide to start the entire dashboard application on your PC.

  You will need two separate terminals open to run both the backend and frontend at the same time.

  ---

  Terminal 1: Start the Backend Server

   1. Navigate to the backend directory:

   1     cd C:\Users\haroo\OneDrive\Documents\My Projects\Perplexity_dashboard\dashboard-backend

   2. Install dependencies (if you haven't already):

   1     npm install

   3. Start the server:
   1     node index.js

   4. Confirmation: You should see a message confirming that the server is running, like:
      🚀 Enhanced NSE Trading Dashboard Backend running on http://localhost:5000

  Leave this terminal open and running.

  ---

  Terminal 2: Start the Frontend Application

   1. Navigate to the frontend directory:

   1     cd C:\Users\haroo\OneDrive\Documents\My Projects\Perplexity_dashboard\frontend

   2. Install dependencies (if you haven't already):

   1     npm install

   3. Start the development server:                                                                                                    
                                                                                                                                       
   1     npm run dev

   4. Confirmation: You will see a message with a URL, which will look something like this:
      > Local: http://localhost:5173/

  Leave this terminal open and running.

  ---

  Final Step: View the Dashboard

   1. Open your web browser (like Chrome, Firefox, or Edge).
   2. Go to the Local URL provided by the frontend server in Terminal 2 (e.g., http://localhost:5173/).

  You should now see the NSE Trading Dashboard application running in your browser.
