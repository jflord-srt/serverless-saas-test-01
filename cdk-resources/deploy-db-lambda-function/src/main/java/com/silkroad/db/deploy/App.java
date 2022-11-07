package com.silkroad.db.deploy;

import org.apache.commons.cli.*;
import org.apache.commons.lang3.StringUtils;

import com.silkroad.db.deploy.Exceptions.*;
import com.silkroad.db.deploy.Types.*;
import com.silkroad.db.deploy.Utils.*;

public class App {
        public static void main(String[] args) throws AppException, ValidationException, ParseException {
                ConsoleLogger logger = new ConsoleLogger();

                // Create Options object
                final Options options = new Options();

                Option helpOption = Option
                                .builder("h")
                                .longOpt("help")
                                .hasArg(false)
                                .required(false)
                                .desc("Print this help message")
                                .build();
                options.addOption(helpOption);

                Option hostnameOption = Option
                                .builder("hn")
                                .longOpt("host_name")
                                .hasArg(true)
                                .required(true)
                                .desc("The RDS hostname (Required)")
                                .build();
                options.addOption(hostnameOption);

                Option hostportOption = Option
                                .builder("hp")
                                .longOpt("host_port")
                                .hasArg(true)
                                .required(true)
                                .desc("The RDS host port (Required)")
                                .build();
                options.addOption(hostportOption);

                Option adminUserNameOption = Option
                                .builder("adun")
                                .longOpt("admin_user_name")
                                .hasArg(true)
                                .required(true)
                                .desc("The RDS admin user name (Required)")
                                .build();
                options.addOption(adminUserNameOption);

                Option adminUserPasswordOption = Option
                                .builder("adup")
                                .longOpt("admin_user_password")
                                .hasArg(true)
                                .required(true)
                                .desc("The RDS admin user password (Required)")
                                .build();
                options.addOption(adminUserPasswordOption);

                Option dbNameOption = Option
                                .builder("dbn")
                                .longOpt("db_name")
                                .hasArg(true)
                                .required(true)
                                .desc("The RDS database name (Required)")
                                .build();
                options.addOption(dbNameOption);

                Option appUserNameOption = Option
                                .builder("apun")
                                .longOpt("app_user_name")
                                .hasArg(true)
                                .required(true)
                                .desc("The RDS app database username (Required)")
                                .build();
                options.addOption(appUserNameOption);

                Option appUserPasswordOption = Option
                                .builder("apup")
                                .longOpt("app_user_password")
                                .hasArg(true)
                                .required(true)
                                .desc("The RDS app database user password (Required)")
                                .build();
                options.addOption(appUserPasswordOption);

                Option isDebugOption = Option
                                .builder("d")
                                .longOpt("debug")
                                .hasArg(false)
                                .required(false)
                                .desc("Controls the output verbosity")
                                .build();
                options.addOption(isDebugOption);

                CommandLineParser parser = new DefaultParser();
                CommandLine cmd = parser.parse(options, args);

                if (cmd.hasOption(helpOption)) {
                        printUsage(options);
                        return;
                }

                boolean validOptions = true;
                for (Option option : cmd.getOptions()) {
                        if (!isValidOption(cmd, option)) {
                                System.err.println("Error: Option '" + option.getLongOpt() + "' is required");
                                validOptions = false;
                        }
                }
                if (!validOptions) {
                        printUsage(options);
                        return;
                }

                RdsHostInfo rdsHostInfo = new RdsHostInfo(
                                cmd.getOptionValue(hostnameOption),
                                Integer.parseInt(cmd.getOptionValue(hostportOption, "3306")));

                RdsAdminSecret rdsAdminSecret = new RdsAdminSecret(
                                cmd.getOptionValue(hostnameOption),
                                Integer.parseInt(cmd.getOptionValue(hostportOption, "3306")),
                                cmd.getOptionValue(adminUserNameOption),
                                cmd.getOptionValue(adminUserPasswordOption));

                RdsAppSecret rdsAppSecret = new RdsAppSecret(
                                cmd.getOptionValue(dbNameOption),
                                cmd.getOptionValue(appUserNameOption),
                                cmd.getOptionValue(appUserPasswordOption));

                Migrator migrator = new Migrator(rdsHostInfo, rdsAdminSecret, rdsAppSecret, logger, true);
                migrator.runInitializationScript();
                migrator.runMigrationScripts();
        }

        public static void printUsage(Options options) {
                HelpFormatter formatter = new HelpFormatter();
                formatter.printHelp("java", options);
                return;
        }

        public static boolean isValidOption(CommandLine cmd, Option option) {
                if (option.isRequired() &&
                                option.hasArg() &&
                                (!cmd.hasOption(option) || StringUtils.isEmpty(cmd.getOptionValue(option)))) {
                        return false;
                } else {
                        return true;
                }
        }
}
