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
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the  
 *     GNU General Public License for more details.  
 *  
 *     You should have received a copy of the GNU General Public License  
 *     along with this program. If not, see <http://www.gnu.org/licenses/>.  
 *******************************************************************************/

var Bukkit = Java.type("org.bukkit.Bukkit");

function CEsilentConsoleCommand() {
    try {
        var silentSender = Bukkit.createCommandSender(function(c) {});
    } catch (e) {
        Bukkit.getLogger().warning("[CEActions] SILENT_CONSOLE_COMMAND ACTION: Action was skipped because your server is not Paper or above!");
        return;
    }
    
    var SilentConsoleCommandAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine, minecraftEvent) {
            if (actionLine) {
                Bukkit.dispatchCommand(silentSender, actionLine);
            } else {
                Bukkit.getLogger().warning("[CEActions] SILENT_CONSOLE_COMMAND ACTION: Invalid format! CORRECT FORMAT: silent_console_command: <command>");
                return;
            }
        }
    });

    var silentConsoleCommandInstance = new SilentConsoleCommandAction("silent_console_command");

    return silentConsoleCommandInstance;
}

CEsilentConsoleCommand();