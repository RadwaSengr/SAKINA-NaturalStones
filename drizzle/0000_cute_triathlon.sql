CREATE TABLE `sakina_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reference` varchar(32) NOT NULL,
	`status` enum('pending_cod') NOT NULL DEFAULT 'pending_cod',
	`paymentMethod` enum('cash_on_delivery') NOT NULL DEFAULT 'cash_on_delivery',
	`customerName` varchar(160) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(32) NOT NULL,
	`addressLine1` text NOT NULL,
	`addressLine2` text,
	`city` varchar(96) NOT NULL,
	`governorate` varchar(96) NOT NULL,
	`postalCode` varchar(24),
	`preparation` enum('single','tasbih') NOT NULL DEFAULT 'single',
	`customerNote` text,
	`itemsJson` text NOT NULL,
	`subtotalPiasters` int NOT NULL,
	`shippingPiasters` int NOT NULL,
	`totalPiasters` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sakina_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `sakina_orders_reference_unique` UNIQUE(`reference`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
