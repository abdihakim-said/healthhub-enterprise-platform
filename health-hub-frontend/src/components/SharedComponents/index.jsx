import React from "react";

export const Card = ({ title, value, color }) => {
  const getBackgroundColor = () => {
    switch (color) {
      case "blue":
        return "bg-blue-500";
      case "green":
        return "bg-green-500";
      case "purple":
        return "bg-purple-500";
      case "orange":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div
      className={`${getBackgroundColor()} text-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow`}
    >
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
};

export const MenuItem = ({ icon: Icon, label, active, onClick }) => (
  <div
    className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer transition-colors ${
      active ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-blue-100"
    }`}
    onClick={onClick}
  >
    <Icon className="h-5 w-5" />
    <span>{label}</span>
  </div>
);
