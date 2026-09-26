import { NextResponse } from "next/server";
import { adminDb } from "../../../firebase/admin";
import { auth } from "@clerk/nextjs/server";

export async function POST(request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let cost, rewardId;
  try {
    const body = await request.json();
    cost = body.cost;
    rewardId = body.rewardId;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!cost || typeof cost !== 'number' || cost <= 0) {
    return NextResponse.json({ error: "Invalid cost" }, { status: 400 });
  }

  try {
    await adminDb.runTransaction(async (transaction) => {
      const userRef = adminDb.collection('users').doc(userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) throw new Error("User not found");
      
      const user = userDoc.data();
      if ((user.points || 0) < cost) {
        throw new Error("Insufficient points");
      }

      transaction.update(userRef, { points: user.points - cost });

      if (rewardId) {
        const redemptionRef = adminDb.collection('redemptions').doc();
        transaction.set(redemptionRef, {
          user_id: userId,
          reward_id: rewardId,
          cost,
          redeemed_at: new Date().toISOString()
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error redeeming reward:", error);
    return NextResponse.json({ error: error.message || "Failed to redeem reward" }, { status: 500 });
  }
}
