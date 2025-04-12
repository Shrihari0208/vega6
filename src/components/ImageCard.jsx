import React from "react";

function ImageCard({ imageUrl, onCaptionClick }) {
  return (
    <div className="flex flex-col items-center p-4 bg-gray-50 rounded shadow">
      <img src={imageUrl} alt="Sample" className="mb-2 rounded" />
      <button
        onClick={onCaptionClick}
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Add Caption
      </button>
    </div>
  );
}

export default ImageCard;
