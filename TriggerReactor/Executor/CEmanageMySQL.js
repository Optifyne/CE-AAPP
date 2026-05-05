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
var DriverManager = Java.type("java.sql.DriverManager");
var SQLException = Java.type("java.sql.SQLException");
var Connection = Java.type("java.sql.Connection");
var PreparedStatement = Java.type("java.sql.PreparedStatement");
var Types = Java.type("java.sql.Types");
var Timestamp = Java.type("java.sql.Timestamp");
var Date = Java.type("java.sql.Date");
var Runnable = Java.type("java.lang.Runnable");

function CEmanageMySQL() {
    var ManageMySQLAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine, minecraftEvent) {
            var args = actionLine.split(";");
            if (args.length < 2) {
                Bukkit.getLogger().warning("[CEActions] MANAGE_MYSQL ACTION: Invalid format! Use: manage_mysql: <jdbc_url>;<sql_query>;(only in case of using ? in the sql_query) <param1>,<param2>,<paramN>");
                return;
            }
			
            var jdbcUrl = args[0].trim();
            var query = args[1].trim();
            
            if (query.toLowerCase().startsWith("select")) {
                Bukkit.getLogger().warning("[CEActions] MANAGE_MYSQL ACTION: You can only modify database in the action, use mysql placeholder to get the data.");
                return;
            }
            
            var params = args.length >= 3 ? args[2].trim().split(",") : [];
            
            function setAutoParam(stmt, index, val) {
                try {
                    if (val.toLowerCase() === "null") {
                        stmt.setNull(index, Types.NULL);
                        return;
                    }

                    if (val === "true" || val === "false") {
                        stmt.setBoolean(index, val === "true");
                        return;
                    }

                    if (/^\d{13}$/.test(val)) {
                        stmt.setTimestamp(index, new Timestamp(java.lang.Long.parseLong(val)));
                        return;
                    }

                    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
                        stmt.setDate(index, Date.valueOf(val));
                        return;
                    }

                    if (/^-?\d+$/.test(val)) {
                        var longVal = java.lang.Long.parseLong(val);
                        if (longVal >= -2147483648 && longVal <= 2147483647) {
                            stmt.setInt(index, parseInt(val));
                        } else {
                            stmt.setLong(index, longVal);
                        }
                        return;
                    }

                    if (/^-?\d+\.\d+$/.test(val)) {
                        stmt.setDouble(index, parseFloat(val));
                        return;
                    }

                    stmt.setString(index, val);
                } catch (e) {
                    Bukkit.getLogger().warning("[CEActions] MANAGE_MYSQL ACTION: Failed to set parameter at index " + index + ": " + e.message);
                    stmt.setString(index, val);
                }
            }

            Bukkit.getScheduler().runTaskAsynchronously(Bukkit.getPluginManager().getPlugin("TriggerReactor"), new (Java.extend(Runnable, {
                run: function() {
                    try {
                        try {
                            var conn = DriverManager.getConnection(jdbcUrl);
                        } catch (e) {
                            Bukkit.getLogger().warning("[CEActions] MANAGE_MYSQL ACTION: Invalid database JDBC link.");
                            return;
                        }

                        try {
                            var stmt = conn.prepareStatement(query);
                        } catch (e) {
                            Bukkit.getLogger().warning("[CEActions] MANAGE_MYSQL ACTION: Invalid query.");
                            return;
                        }

                        for (var i = 0; i < params.length; i++) {
                            var val = params[i].trim();
                            setAutoParam(stmt, i + 1, val);
                        }

                        stmt.executeUpdate();

                        stmt.close();
                        conn.close();
                    } catch (e) {
                        if (e instanceof SQLException) {
                            Bukkit.getLogger().warning("[CEActions] MANAGE_MYSQL ACTION: SQL Error: " + e.message);
                        } else {
                            Bukkit.getLogger().warning("[CEActions] MANAGE_MYSQL ACTION: Unknown error: " + e.message);
                        }
                        return;
                    }
                }
            }))());
        }
    });

    var manageMySQLInstance = new ManageMySQLAction("manage_mysql");
    
    return manageMySQLInstance;
}

CEmanageMySQL();