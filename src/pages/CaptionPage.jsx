import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import * as fabric from "fabric";

function CaptionPage() {
  const [searchParams] = useSearchParams();
  const imageUrl =
    searchParams.get("imageUrl") ||
    "https://via.placeholder.com/400?text=No+Image";
  const [caption, setCaption] = useState("");
  const canvasRef = useRef(null);
  const canvasInstance = useRef(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [textColor, setTextColor] = useState("#ffffff");
  const [textStroke, setTextStroke] = useState("#000000");
  const [fontSize, setFontSize] = useState(30);
  const [layersLog, setLayersLog] = useState([]);
  const [showLayersLog, setShowLayersLog] = useState(false);

  // Available emoji sets
  const emojiSets = {
    Faces: ["😀", "😂", "😍", "😎", "🤔", "😴", "😱", "🥳"],
    Animals: ["🐶", "🐱", "🐼", "🦁", "🐸", "🦊", "🐢", "🦄"],
    Food: ["🍕", "🍔", "🍦", "🍩", "🍓", "🍌", "🥑", "🍰"],
    Symbols: ["❤️", "⭐", "✨", "💯", "🔥", "🎉", "💥", "🌈"],
  };

  const [activeEmojiSet, setActiveEmojiSet] = useState("Faces");

  // Initialize the canvas on component mount
  useEffect(() => {
    // Create a new canvas instance
    canvasInstance.current = new fabric.Canvas("canvas", {
      width: 800,
      height: 600,
      backgroundColor: "#f0f0f0",
    });

    // Set up object added/modified event handlers
    canvasInstance.current.on("object:added", logCanvasLayers);
    canvasInstance.current.on("object:modified", logCanvasLayers);
    canvasInstance.current.on("object:removed", logCanvasLayers);

    setIsCanvasReady(true);

    return () => {
      if (canvasInstance.current) {
        canvasInstance.current.off("object:added", logCanvasLayers);
        canvasInstance.current.off("object:modified", logCanvasLayers);
        canvasInstance.current.off("object:removed", logCanvasLayers);
        canvasInstance.current.dispose();
      }
    };
  }, []);

  // Function to log all canvas layers and their attributes
  const logCanvasLayers = () => {
    if (!canvasInstance.current) return;

    const objects = canvasInstance.current.getObjects();
    const layersData = objects.map((obj, index) => {
      // Get object type
      const type = obj.type || "unknown";

      // Basic attributes for all objects
      const commonAttrs = {
        id: obj.id || index,
        type: type,
        left: obj.left,
        top: obj.top,
        width: obj.width,
        height: obj.height,
        scaleX: obj.scaleX,
        scaleY: obj.scaleY,
        angle: obj.angle,
        selectable: obj.selectable,
        zIndex: index, // Layer order in canvas
      };

      // Object-specific attributes
      let specificAttrs = {};

      switch (type) {
        case "image":
          specificAttrs = {
            src: obj.getSrc ? obj.getSrc() : "unknown",
            crossOrigin: obj.crossOrigin,
          };
          break;
        case "text":
        case "textbox":
          specificAttrs = {
            text: obj.text,
            fontSize: obj.fontSize,
            fontFamily: obj.fontFamily,
            fill: obj.fill,
            stroke: obj.stroke,
            strokeWidth: obj.strokeWidth,
            textAlign: obj.textAlign,
          };
          break;
        case "rect":
        case "circle":
        case "triangle":
        case "polygon":
          specificAttrs = {
            fill: obj.fill,
            stroke: obj.stroke,
            strokeWidth: obj.strokeWidth,
            radius: obj.radius, // For circles
            points: obj.points
              ? obj.points.map((p) => ({ x: p.x, y: p.y }))
              : undefined, // For polygons
          };
          break;
        default:
          break;
      }

      return {
        ...commonAttrs,
        ...specificAttrs,
      };
    });

    console.log("Canvas Layers:", layersData);
    setLayersLog(layersData);
  };

  useEffect(() => {
    if (!isCanvasReady || !canvasInstance.current) return;

    // Clear existing canvas content
    canvasInstance.current.clear();

    // Create an HTML Image element
    const imgElement = new Image();
    imgElement.crossOrigin = "anonymous";

    imgElement.onload = function () {
      // Create fabric image from the loaded HTML Image
      const fabricImage = new fabric.Image(imgElement, {
        left: canvasInstance.current.width / 2,
        top: canvasInstance.current.height / 2,
        originX: "center",
        originY: "center",
        selectable: false,
        hoverCursor: "default",
      });

      // Calculate scaling to fit image in canvas while maintaining aspect ratio
      const canvasWidth = canvasInstance.current.width;
      const canvasHeight = canvasInstance.current.height;
      const scaleX = canvasWidth / fabricImage.width;
      const scaleY = canvasHeight / fabricImage.height;
      const scale = Math.min(scaleX, scaleY) * 0.9; // 90% of the max possible size

      fabricImage.scale(scale);

      // Add the image to canvas
      canvasInstance.current.add(fabricImage);

      // Send image to back so other elements appear on top
      fabricImage.sendToBack();

      canvasInstance.current.renderAll();

      // Log layers after image is loaded
      logCanvasLayers();
    };

    imgElement.onerror = function () {
      console.error("Error loading image");
    };

    // Set the source to start loading
    imgElement.src = imageUrl;
  }, [imageUrl, isCanvasReady]);

  const handleAddCaption = () => {
    if (!caption.trim() || !canvasInstance.current) return;

    const text = new fabric.Textbox(caption, {
      left: canvasInstance.current.width / 2,
      top: canvasInstance.current.height / 2,
      originX: "center",
      originY: "center",
      fontFamily: "Arial",
      fontSize: fontSize,
      fill: textColor,
      stroke: textStroke,
      strokeWidth: 1,
      textAlign: "center",
      width: 300,
      selectable: true,
      padding: 10,
    });

    canvasInstance.current.add(text);
    canvasInstance.current.setActiveObject(text);
    canvasInstance.current.renderAll();
    setCaption("");
  };

  const handleAddEmoji = (emoji) => {
    if (!canvasInstance.current) return;

    const text = new fabric.Text(emoji, {
      left: canvasInstance.current.width / 2,
      top: canvasInstance.current.height / 2,
      fontSize: 50,
      selectable: true,
    });

    canvasInstance.current.add(text);
    canvasInstance.current.setActiveObject(text);
    canvasInstance.current.renderAll();
  };

  const handleAddShape = (shapeType) => {
    if (!canvasInstance.current) return;

    let shape;
    const colors = {
      rectangle: { fill: "rgba(255,105,97,0.5)", stroke: "#ff6961" },
      circle: { fill: "rgba(119,221,119,0.5)", stroke: "#77dd77" },
      triangle: { fill: "rgba(108,180,238,0.5)", stroke: "#6cb4ee" },
      star: { fill: "rgba(253,253,150,0.5)", stroke: "#fdfd96" },
    };

    // Define points outside of switch for star shape
    const outerRadius = 50;
    const innerRadius = 25;
    const points = [];

    switch (shapeType) {
      case "rectangle":
        shape = new fabric.Rect({
          width: 100,
          height: 100,
          fill: colors.rectangle.fill,
          stroke: colors.rectangle.stroke,
          strokeWidth: 2,
        });
        break;
      case "circle":
        shape = new fabric.Circle({
          radius: 50,
          fill: colors.circle.fill,
          stroke: colors.circle.stroke,
          strokeWidth: 2,
        });
        break;
      case "triangle":
        shape = new fabric.Triangle({
          width: 100,
          height: 100,
          fill: colors.triangle.fill,
          stroke: colors.triangle.stroke,
          strokeWidth: 2,
        });
        break;
      case "star":
        // Create points for star shape
        for (let i = 0; i < 10; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i * Math.PI) / 5;
          points.push({
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle),
          });
        }
        shape = new fabric.Polygon(points, {
          fill: colors.star.fill,
          stroke: colors.star.stroke,
          strokeWidth: 2,
        });
        break;
      default:
        return;
    }

    shape.set({
      left: canvasInstance.current.width / 2,
      top: canvasInstance.current.height / 2,
      originX: "center",
      originY: "center",
      selectable: true,
    });

    canvasInstance.current.add(shape);
    canvasInstance.current.setActiveObject(shape);
    canvasInstance.current.renderAll();
  };

  const handleClearCanvas = () => {
    if (!canvasInstance.current) return;

    // Keep only the base image
    const objects = canvasInstance.current.getObjects();
    if (objects.length > 0) {
      const baseImage = objects[0];
      canvasInstance.current.clear();
      canvasInstance.current.add(baseImage);
      canvasInstance.current.renderAll();
    }
  };

  const handleToggleLayersLog = () => {
    // Refresh layers log
    logCanvasLayers();
    // Toggle visibility
    setShowLayersLog(!showLayersLog);
  };

  const handleDownload = () => {
    if (!canvasInstance.current) return;

    const dataURL = canvasInstance.current.toDataURL({
      format: "png",
      quality: 1,
    });

    const link = document.createElement("a");
    link.download = "edited-image.png";
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Creative Image Editor
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Canvas Section */}
        <div className="flex-1 border rounded-lg shadow-md overflow-hidden bg-white">
          <div className="p-1 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            <div className="bg-white p-2">
              <canvas id="canvas" ref={canvasRef} />
            </div>
          </div>
        </div>

        {/* Tools Section */}
        <div className="flex flex-col gap-6 w-full lg:w-96">
          {/* Text Tool */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="bg-blue-500 text-white py-2 px-4">
              <h2 className="font-semibold">Add Text</h2>
            </div>
            <div className="p-4">
              <textarea
                rows="2"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full px-3 py-2 border rounded-md resize-y mb-4 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none"
                placeholder="Type your text here"
              />

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Font Size: {fontSize}px
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Text
                    </label>
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-full h-8 cursor-pointer border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Outline
                    </label>
                    <input
                      type="color"
                      value={textStroke}
                      onChange={(e) => setTextStroke(e.target.value)}
                      className="w-full h-8 cursor-pointer border rounded"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddCaption}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium"
              >
                Add Text
              </button>
            </div>
          </div>

          {/* Emoji Section */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="bg-pink-500 text-white py-2 px-4">
              <h2 className="font-semibold">Add Emoji</h2>
            </div>
            <div className="p-4">
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {Object.keys(emojiSets).map((setName) => (
                  <button
                    key={setName}
                    onClick={() => setActiveEmojiSet(setName)}
                    className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                      activeEmojiSet === setName
                        ? "bg-pink-500 text-white"
                        : "bg-gray-200 hover:bg-gray-300"
                    } transition-colors`}
                  >
                    {setName}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-3">
                {emojiSets[activeEmojiSet].map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => handleAddEmoji(emoji)}
                    className="p-2 text-2xl bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Shape Tools */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="bg-green-500 text-white py-2 px-4">
              <h2 className="font-semibold">Add Shapes</h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleAddShape("rectangle")}
                  className="px-4 py-2 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-md hover:from-red-500 hover:to-red-600 transition-colors"
                >
                  Rectangle
                </button>
                <button
                  onClick={() => handleAddShape("circle")}
                  className="px-4 py-2 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-md hover:from-green-500 hover:to-green-600 transition-colors"
                >
                  Circle
                </button>
                <button
                  onClick={() => handleAddShape("triangle")}
                  className="px-4 py-2 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-md hover:from-blue-500 hover:to-blue-600 transition-colors"
                >
                  Triangle
                </button>
                <button
                  onClick={() => handleAddShape("star")}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-md hover:from-yellow-500 hover:to-yellow-600 transition-colors"
                >
                  Star
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleClearCanvas}
              className="px-4 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors font-medium"
            >
              Clear All
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-3 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors font-medium"
            >
              Download
            </button>
          </div>

          {/* Layers Debug Button */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="bg-gray-700 text-white py-2 px-4">
              <h2 className="font-semibold">Debug Tools</h2>
            </div>
            <div className="p-4">
              <button
                onClick={handleToggleLayersLog}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors font-medium"
              >
                {showLayersLog ? "Hide Layers Log" : "Show Layers Log"}
              </button>

              {showLayersLog && (
                <div className="mt-4 overflow-auto max-h-80 border rounded p-2 bg-gray-100">
                  <h3 className="font-medium mb-2">
                    Canvas Layers ({layersLog.length}):
                  </h3>
                  <pre className="text-xs whitespace-pre-wrap overflow-x-auto bg-white p-3 rounded border">
                    {JSON.stringify(layersLog, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CaptionPage;
