'use strict';

module.exports = (code) => {
    switch (code) {
        case 1:
            return 'Time out occurred because carriage return <CR> not received. The request was not processed.';
        case 2:
            return 'Invalid module address (module does not exist) received when attempting to ascertain the version number (getversion).';
        case 3:
            return 'Invalid module address (module does not exist).';
        case 4:
            return 'Invalid connector address.';
        case 5:
            return 'Connector address 1 is set up as “sensor in” when attempting to send an IR command.';
        case 6:
            return 'Connector address 2 is set up as “sensor in” when attempting to send an IR command.';
        case 7:
            return 'Connector address 3 is set up as “sensor in” when attempting to send an IR command.';
        case 8:
            return 'Offset is set to an even transition number, but should be set to an odd transition number in the IR command.';
        case 9:
            return 'Maximum number of transitions exceeded (256 total on/off transitions allowed).';
        case 10:
            return 'Number of transitions in the IR command is not even (the same number of on and off transitions is required).';
        case 11:
            return 'Contact closure command sent to a module that is not a relay..';
        case 12:
            return 'Missing carriage return. All commands must end with a carriage return.';
        case 13:
            return 'State was requested of an invalid connector address, or the connector is programmed as IR out and not sensor in.';
        case 14:
            return 'Command sent to the unit is not supported by the GC-100.';
        case 15:
            return 'Maximum number of IR transitions exceeded. (SM_IR_INPROCESS)';
        case 16:
            return 'Invalid number of IR transitions (must be an even number).';
        case 21:
            return 'Attempted to send an IR command to a non-IR module.';
        case 23:
            return 'Command sent is not supported by this type of module.';
        default:
            return code;
    }
};
