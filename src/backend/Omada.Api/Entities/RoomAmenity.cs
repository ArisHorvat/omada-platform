namespace Omada.Api.Entities;

/// <summary>
/// Canonical amenities for rooms. Stored as JSON string names on <see cref="Room.AmenitiesJson"/> (e.g. ["VideoProjector","VideoConference"]).
/// </summary>
public enum RoomAmenity
{
    VideoProjector = 0,
    InteractiveSmartBoard,
    WirelessPresentation,
    VideoConference,
    MicrophoneArray,
    DocumentCamera,
    HearingLoop,
    ComputerWorkstations,
    WhiteboardWall,
    Kitchenette,
    AcousticPanels,
    DimmingLights,
}
