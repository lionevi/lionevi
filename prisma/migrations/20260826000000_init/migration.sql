-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SELLER', 'BUYER', 'BOTH', 'ADMIN');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'SIMILARITY_CHECK', 'PUBLISHED', 'SOLD', 'ARCHIVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SellingMode" AS ENUM ('FIXED_PRICE', 'AUCTION');

-- CreateEnum
CREATE TYPE "DisplayLevel" AS ENUM ('PREMIUM', 'FEATURED', 'STANDARD', 'LOW');

-- CreateEnum
CREATE TYPE "SimilarityStatus" AS ENUM ('CLEAR', 'MODERATE', 'HIGH', 'DUPLICATE');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'REFUNDED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('STRIPE', 'WAVE', 'ORANGE_MONEY', 'MTN_MOBILE_MONEY', 'WALLET');

-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('ACTIVE', 'WINNING', 'LOST', 'REFUNDED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_BID', 'OUTBID', 'AUCTION_WON', 'AUCTION_LOST', 'PROJECT_SOLD', 'PROJECT_PURCHASED', 'NEW_MESSAGE', 'PROJECT_REVIEWED', 'PROJECT_PUBLISHED', 'PROJECT_REJECTED', 'PAYMENT_RECEIVED', 'WITHDRAWAL_PROCESSED', 'SIMILARITY_ALERT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "role" "Role" NOT NULL DEFAULT 'BOTH',
    "bio" TEXT,
    "country" TEXT NOT NULL DEFAULT 'BJ',
    "phone" TEXT,
    "wallet_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_banned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sector_tags" TEXT[],
    "problem_statement" TEXT NOT NULL,
    "target_market" TEXT NOT NULL,
    "cover_image_url" TEXT,
    "executive_summary" TEXT,
    "market_size" TEXT,
    "competitive_advantage" TEXT,
    "full_description" TEXT,
    "solution_detail" TEXT,
    "business_model" TEXT,
    "implementation_steps" TEXT[],
    "resources_identified" TEXT,
    "images" TEXT[],
    "attachments" JSONB[],
    "video_url" TEXT,
    "estimated_cost_min" DOUBLE PRECISION,
    "estimated_cost_max" DOUBLE PRECISION,
    "implementation_months" INTEGER,
    "projected_revenue" TEXT,
    "selling_mode" "SellingMode" NOT NULL,
    "fixed_price" DOUBLE PRECISION,
    "auction_start_price" DOUBLE PRECISION,
    "auction_reserve_price" DOUBLE PRECISION,
    "auction_end_date" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "display_level" "DisplayLevel",
    "ai_score" DOUBLE PRECISION,
    "ai_evaluation" JSONB,
    "ai_teaser" TEXT,
    "content_hash" TEXT,
    "submitted_at" TIMESTAMP(3),
    "similarity_status" "SimilarityStatus",
    "similar_projects" JSONB,
    "similarity_note" TEXT,
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "saves_count" INTEGER NOT NULL DEFAULT 0,
    "seller_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "bidder_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "BidStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "platform_fee" DOUBLE PRECISION NOT NULL,
    "seller_earnings" DOUBLE PRECISION NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "contract_url" TEXT,
    "stripe_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NDAgreement" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL,
    "signed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NDAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "project_id" TEXT,
    "content" TEXT NOT NULL,
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedProject" (
    "user_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedProject_pkey" PRIMARY KEY ("user_id","project_id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "reviewed_id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "Project_status_display_level_idx" ON "Project"("status", "display_level");

-- CreateIndex
CREATE INDEX "Project_category_idx" ON "Project"("category");

-- CreateIndex
CREATE INDEX "Project_seller_id_idx" ON "Project"("seller_id");

-- CreateIndex
CREATE INDEX "Project_content_hash_idx" ON "Project"("content_hash");

-- CreateIndex
CREATE INDEX "Bid_project_id_amount_idx" ON "Bid"("project_id", "amount");

-- CreateIndex
CREATE INDEX "Bid_bidder_id_idx" ON "Bid"("bidder_id");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_project_id_key" ON "Transaction"("project_id");

-- CreateIndex
CREATE INDEX "Transaction_buyer_id_idx" ON "Transaction"("buyer_id");

-- CreateIndex
CREATE INDEX "Transaction_seller_id_idx" ON "Transaction"("seller_id");

-- CreateIndex
CREATE UNIQUE INDEX "NDAgreement_user_id_project_id_key" ON "NDAgreement"("user_id", "project_id");

-- CreateIndex
CREATE INDEX "Message_sender_id_receiver_id_idx" ON "Message"("sender_id", "receiver_id");

-- CreateIndex
CREATE INDEX "Message_receiver_id_is_read_idx" ON "Message"("receiver_id", "is_read");

-- CreateIndex
CREATE INDEX "Notification_user_id_is_read_idx" ON "Notification"("user_id", "is_read");

-- CreateIndex
CREATE UNIQUE INDEX "Review_transaction_id_key" ON "Review"("transaction_id");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_bidder_id_fkey" FOREIGN KEY ("bidder_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NDAgreement" ADD CONSTRAINT "NDAgreement_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NDAgreement" ADD CONSTRAINT "NDAgreement_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedProject" ADD CONSTRAINT "SavedProject_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedProject" ADD CONSTRAINT "SavedProject_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewed_id_fkey" FOREIGN KEY ("reviewed_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

