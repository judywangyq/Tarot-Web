-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Movie` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `releaseYear` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReviewsList` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `rating` INTEGER NOT NULL DEFAULT 1,
    `comment` VARCHAR(191) NULL,
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `contributorID` INTEGER NOT NULL,
    `movieId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Card` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `number` VARCHAR(191) NOT NULL,
    `arcana` VARCHAR(191) NOT NULL,
    `suit` VARCHAR(191) NOT NULL,
    `img` VARCHAR(191) NOT NULL,
    `fortune_telling` VARCHAR(191) NOT NULL,
    `keywords` VARCHAR(191) NOT NULL,
    `meanings` JSON NOT NULL,
    `archetype` VARCHAR(191) NOT NULL,
    `hebrew_alphabet` VARCHAR(191) NOT NULL,
    `numerology` VARCHAR(191) NOT NULL,
    `elemental` VARCHAR(191) NOT NULL,
    `mythical_spiritual` VARCHAR(191) NOT NULL,
    `questions_to_ask` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ReviewsList` ADD CONSTRAINT `ReviewsList_contributorID_fkey` FOREIGN KEY (`contributorID`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReviewsList` ADD CONSTRAINT `ReviewsList_movieId_fkey` FOREIGN KEY (`movieId`) REFERENCES `Movie`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
