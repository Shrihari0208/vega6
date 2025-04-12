import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ImageCard from "../components/ImageCard";

function SearchPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          searchTerm
        )}&per_page=12`,
        {
          headers: {
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch images");
      }

      const data = await response.json();
      setImages(data.results.map((photo) => photo.urls.regular));
    } catch (err) {
      setError(err.message);
      console.error("Error fetching images:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow rounded mt-8">
      {/* User Information */}
      <div className="flex gap-6 mb-6">
        <div className="flex flex-col">
          <label htmlFor="name" className="mb-1 font-medium">
            Name:
          </label>
          <input
            type="text"
            id="name"
            placeholder="Your Name"
            value="Shrihari Deshmukh"
            onChange={(e) => setName(e.target.value)}
            className="px-3 py-2 border rounded "
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="email" className="mb-1 font-medium">
            Email:
          </label>
          <input
            type="email"
            id="email"
            placeholder="Your Email"
            value="shriharideshmukh382@gmail.com"
            onChange={(e) => setEmail(e.target.value)}
            className="px-3 py-2 border rounded w-[300px]"
          />
        </div>
      </div>

      {/* Search Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-4">Search for Images</h1>
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="search"
            placeholder="Enter your search term"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border rounded"
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={loading}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      {/* Search Results */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {images.map((src, index) => (
          <ImageCard
            key={index}
            imageUrl={src}
            onCaptionClick={() =>
              navigate(`/caption?imageUrl=${encodeURIComponent(src)}`)
            }
          />
        ))}
      </div>
    </div>
  );
}

export default SearchPage;
