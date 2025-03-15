
const {
    createNewClan,
} = require('./ClanHandler/clanCreation');

const {
    updateClanDetails,
} = require('./ClanHandler/clanUpdate');

const {
    leaveClan,
    joinClan,
    handleRequestJoin
} = require('./ClanHandler/clanMembership');

const {
    searchClan
} = require('./ClanHandler/clanSearch');

const {
    promote,
    demote,
    kick
} = require('./ClanHandler/clanMemberRoles');

const {
    sendClanJoinInviteNotification,
    acceptRejectClanJoinInviteNotification
} = require('./ClanHandler/clanJoinInvitation');

const {
    clanWarSearch
} = require('./ClanHandler/clanWarHandler');

const {
    clanMemberLastSeenUpdate
} = require('./ClanHandler/clanMemberLastSeenUpdate');


module.exports = {
    createNewClan,
    leaveClan,
    joinClan,
    searchClan,
    handleRequestJoin,
    promote,
    demote,
    kick,
    updateClanDetails,
    sendClanJoinInviteNotification,
    acceptRejectClanJoinInviteNotification,
    clanWarSearch,
    clanMemberLastSeenUpdate
}
