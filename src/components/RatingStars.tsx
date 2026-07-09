"use client";

type Props = {
  rating: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (val: number) => void;
};

export default function RatingStars({ rating, size = "md", interactive, onChange }: Props) {
  const sizes = { sm: "text-sm", md: "text-xl", lg: "text-3xl" };

  return (
    <div className={`flex gap-0.5 ${sizes[size]}`} dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          className={`transition ${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} ${star <= rating ? "text-yellow-400" : "text-white/20"}`}
          onClick={() => interactive && onChange?.(star)}
        >
          ★
        </button>
      ))}
    </div>
  );
}
