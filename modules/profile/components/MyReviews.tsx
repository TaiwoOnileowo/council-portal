import { MessageSquareText, Star } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { mockReviews } from "./profileData";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-portal-border text-portal-border"
          }`}
        />
      ))}
    </div>
  );
}

export default function MyReviews() {
  return (
    <div className="bg-portal-surface border border-portal-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-[10px] bg-portal-purple-bg flex items-center justify-center">
            <MessageSquareText className="w-4 h-4 text-portal-purple" />
          </div>
          <h3 className="font-heading text-[15px] font-bold text-portal-text">
            My Reviews
          </h3>
        </div>
        <span className="text-[12px] text-portal-muted font-medium">
          {mockReviews.length} review{mockReviews.length !== 1 ? "s" : ""}
        </span>
      </div>

      {mockReviews.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquareText className="w-8 h-8 text-portal-border mx-auto mb-2" />
          <p className="text-[13px] text-portal-muted">
            No reviews yet. Book a ride and share your experience!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {mockReviews.map((review, idx) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                delay: 0.26 + idx * 0.06,
                ease: "easeOut",
              }}
              className="border border-portal-border rounded-xl p-4 hover:border-portal-border2 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-[30px] h-[30px] rounded-lg overflow-hidden">
                    <Image
                      src={review.vendorLogo}
                      alt={review.vendorName}
                      width={30}
                      height={30}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-portal-text">
                      {review.vendorName}
                    </p>
                    <StarRating rating={review.rating} />
                  </div>
                </div>
                <span className="text-[11px] text-portal-muted">
                  {review.date}
                </span>
              </div>
              <p className="text-[12.5px] text-portal-text2 leading-relaxed">
                {review.comment}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
