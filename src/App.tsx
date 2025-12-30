import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import "./App.css";
import Form from "./pages/Form";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/form" element={<Form />} />
      </Routes>
    </div>
  );
}

function Home() {
  return (
    <header className="App-header">
      <h1>Welcome to the Application</h1>
      <Link to="/form" className="App-link">
        Go to Form
      </Link>
    </header>
  );
}

export default App;
