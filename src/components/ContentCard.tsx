import React from "react";

function ContentCard({
  content,
  onClick,
  onDelete,
}: {
  content: any;
  onClick: () => void;
  onDelete: (name: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl flex relative flex-col items-center hover:scale-105 hover:cursor-pointer transition-transform active:opacity-70 duration-300 ease-in-out px-4 pt-4 overflow-hidden">
      <img
        src={`/${content.previewImage}`}
        alt={content.name}
        className="w-full h-48 object-cover"
      />
      <p className="my-4 text-2xl">{content.name}</p>
    </div>
  );
}

export default ContentCard;
