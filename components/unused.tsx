
            //   {tab === "reviews" && (
            //     <div className="space-y-3">
            //       {vendor.reviewsList.map((rev, i) => (
            //         <div
            //           key={i}
            //           className="bg-portal-bg rounded-xl px-4 py-3.5"
            //         >
            //           <div className="flex items-center gap-2 mb-1.5">
            //             <div className="w-7 h-7 rounded-full bg-portal-border2 flex items-center justify-center text-[11px] font-bold text-portal-text2">
            //               {rev.name.charAt(0)}
            //             </div>
            //             <div className="flex-1">
            //               <p className="text-[12px] font-semibold">
            //                 {rev.name}
            //               </p>
            //               <p className="text-[10px] text-portal-muted">
            //                 {rev.date}
            //               </p>
            //             </div>
            //             <StarRating full={rev.rating} />
            //           </div>
            //           <p className="text-[12px] text-portal-text2 leading-relaxed ml-9">
            //             {rev.comment}
            //           </p>
            //         </div>
            //       ))}
            //     </div>
            //   )}
//             function StarRating({
//   full,
//   size = "sm",
// }: {
//   full: number;
//   size?: "sm" | "md";
// }) {
//   const s = size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";
//   return (
//     <div className="flex gap-0.5">
//       {[1, 2, 3, 4, 5].map((i) => (
//         <Star
//           key={i}
//           className={`${s} ${
//             i <= full
//               ? "fill-amber-400 text-amber-400"
//               : "fill-portal-border text-portal-border"
//           }`}
//         />
//       ))}
//     </div>
//   );
// }