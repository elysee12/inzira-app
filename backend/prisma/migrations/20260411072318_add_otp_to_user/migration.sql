-- AlterTable
ALTER TABLE `user` ADD COLUMN `otpCode` VARCHAR(191) NULL,
    ADD COLUMN `otpExpires` DATETIME(3) NULL;
