CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`issueId` int NOT NULL,
	`authorId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `issues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reporterId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` enum('road_damage','traffic_hazard','sanitation','water','electrical','other') NOT NULL,
	`status` enum('pending','verified','in_progress','resolved','rejected') NOT NULL DEFAULT 'pending',
	`latitude` decimal(10,8) NOT NULL,
	`longitude` decimal(11,8) NOT NULL,
	`address` text,
	`landmark` varchar(255),
	`imageUrl` text,
	`upvoteCount` int NOT NULL DEFAULT 0,
	`commentCount` int NOT NULL DEFAULT 0,
	`verifiedBy` int,
	`resolvedBy` int,
	`rejectionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`resolvedAt` timestamp,
	CONSTRAINT `issues_id` PRIMARY KEY(`id`),
	CONSTRAINT `idx_reporterId` UNIQUE(`reporterId`),
	CONSTRAINT `idx_status` UNIQUE(`status`),
	CONSTRAINT `idx_category` UNIQUE(`category`),
	CONSTRAINT `idx_location` UNIQUE(`latitude`,`longitude`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`issueId` int,
	`type` enum('status_update','comment','upvote','mention') NOT NULL,
	`message` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `upvotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`issueId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `upvotes_id` PRIMARY KEY(`id`),
	CONSTRAINT `idx_unique_upvote` UNIQUE(`issueId`,`userId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `trustScore` int DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `totalReports` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `verifiedReports` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `avatar` text;--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);