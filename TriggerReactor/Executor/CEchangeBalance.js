/*******************************************************************************
 *     Copyright (c) 2023 TriggerReactor Team
 *
 *     This program is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     This program is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *******************************************************************************/

var Bukkit = Java.type("org.bukkit.Bukkit");
var ConditionalEventsAction = Java.type("ce.ajneb97.api.ConditionalEventsAction");
var essentialsPlugin = Bukkit.getPluginManager().getPlugin("Essentials");
var BigDecimal = Java.type("java.math.BigDecimal");
var UUID = Java.type("java.util.UUID");

function CEchangeBalance() {
    if (!essentialsPlugin) {
        Bukkit.getLogger().warning("[CEActions] CHANGE_BALANCE ACTION: Action was skipped because EssentialsX plugin is missing!");
        return;
    } else {
        var ChangeBalanceAction = Java.extend(ConditionalEventsAction, {
            execute: function(player, actionLine, minecraftEvent) {
                var args = actionLine.split(";");
                if (args.length < 3) {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_BALANCE ACTION: Invalid actionLine format! CORRECT FORMAT: change_balance: <player>;<amount>;<operation (SET, ADD, REMOVE, MULTIPLY, DIVIDE, RESET)>");
                    return;
                }

                var targetName = args[0].trim();
                var amount = args[1] !== "" && !isNaN(args[1]) ? new BigDecimal(args[1].trim()) : null;
                var operation = args[2].trim().toUpperCase();
                
                if (!amount) {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_BALANCE ACTION: Invalid amount!");
                    return;
                }

				var targetPlayer = Bukkit.getPlayer(targetName);
                if (!targetPlayer) {
                    try {
                        var uuid = UUID.fromString(targetName);
                        targetPlayer = Bukkit.getOfflinePlayer(uuid);
                    } catch (e) {
                    	targetPlayer = Bukkit.getOfflinePlayer(targetName);
                    }
                }
                
                if (!targetPlayer) {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_BALANCE ACTION: Player '" + targetName + "' not found!");
                    return;
                }

                var user = essentialsPlugin.getUser(targetPlayer);
                if (!user) {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_BALANCE ACTION: Unable to fetch Essentials user for '" + targetName + "'!");
                    return;
                }

                this.applyOperation(user, amount, operation);
            },

            applyOperation: function(user, amount, operation) {
                var currentBalance = user.getMoney();
                var newBalance;

                switch (operation) {
                    case "SET":
                        newBalance = amount;
                        if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
                            newBalance = BigDecimal.ZERO;
                        }
                        break;
                    case "ADD":
                        newBalance = currentBalance.add(amount);
                        if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
                            newBalance = BigDecimal.ZERO;
                        }
                        break;
                    case "REMOVE":
                        newBalance = currentBalance.subtract(amount);
                        if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
                            newBalance = BigDecimal.ZERO;
                        }
                        break;
                    case "MULTIPLY":
                        newBalance = currentBalance.multiply(amount);
                        if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
                            newBalance = BigDecimal.ZERO;
                        }
                        break;
                    case "DIVIDE":
                        if (amount.compareTo(BigDecimal.ZERO) == 0) {
                            Bukkit.getLogger().warning("[CEActions] CHANGE_BALANCE ACTION: Cannot divide by zero!");
                            return;
                        }
                        newBalance = currentBalance.divide(amount, BigDecimal.ROUND_DOWN);
                        if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
                            newBalance = BigDecimal.ZERO;
                        }
                        break;
                    case "RESET":
                        newBalance = BigDecimal.ZERO;
                        break;
                    default:
                        Bukkit.getLogger().warning("[CEActions] CHANGE_BALANCE ACTION: Invalid operation '" + operation + "'");
                        return;
    			}

                user.setMoney(newBalance);
            }
        });

        var changeBalanceInstance = new ChangeBalanceAction("change_balance");
        
        return changeBalanceInstance;
    }
}

CEchangeBalance();