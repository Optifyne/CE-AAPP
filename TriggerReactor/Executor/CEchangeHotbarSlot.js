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
var ConditionalEventsAction = Java.type("ce.ajneb97.api.ConditionalEventsAction");

function CEchangeHotbarSlot() {
    var ChangeHotbarSlotAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine, minecraftEvent) {
            var args = actionLine.split(";");
            if (args.length != 2) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_HOTBAR_SLOT ACTION: Invalid format! Correct format: change_hotbar_slot: <player>;<slot>");
                return;
            }

            var targetName = args[0].trim();
            var slotString = args[1].trim();

            var target = Bukkit.getPlayer(targetName);
            if (!target) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_HOTBAR_SLOT ACTION: Target player not found!");
                return;
            }

            var slot;
            try {
                slot = parseInt(slotString);
            } catch (e) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_HOTBAR_SLOT ACTION: Invalid slot number!");
                return;
            }

            if (isNaN(slot) || slot < 0 || slot > 8) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_HOTBAR_SLOT ACTION: Slot must be a number from 0 to 8!");
                return;
            }

            target.getInventory().setHeldItemSlot(slot);
        }
    });

    var changeHotbarSlotInstance = new ChangeHotbarSlotAction("change_hotbar_slot");
    
    return changeHotbarSlotInstance;
}

CEchangeHotbarSlot();