--liquibase formatted sql

--changeset author:jlord
CREATE TABLE `DeploymentSetting` (
  `Id`           int NOT NULL AUTO_INCREMENT,
  `SettingType`  varchar(250) NOT NULL,
  `SettingValue` varchar(1000) NOT NULL,
  `Timestamp`    bigint NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
