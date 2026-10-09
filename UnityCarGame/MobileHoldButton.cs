using UnityEngine;
using UnityEngine.EventSystems;

/// <summary>
/// Attach to a Unity UI Button/Image and select the desired VehicleInput action.
/// The event calls the input method on both press and release, so steering/throttle won't stick.
/// </summary>
public sealed class MobileHoldButton : MonoBehaviour, IPointerDownHandler, IPointerUpHandler, IPointerExitHandler
{
    public VehicleInput target;
    public HoldAction action;

    public enum HoldAction { Throttle, Brake, Left, Right, Handbrake }

    public void OnPointerDown(PointerEventData eventData) => SetPressed(true);
    public void OnPointerUp(PointerEventData eventData) => SetPressed(false);
    public void OnPointerExit(PointerEventData eventData) => SetPressed(false);

    private void OnDisable() => SetPressed(false);

    private void SetPressed(bool pressed)
    {
        if (!target) return;
        switch (action)
        {
            case HoldAction.Throttle: target.SetThrottle(pressed); break;
            case HoldAction.Brake: target.SetBrake(pressed); break;
            case HoldAction.Left: target.SetLeft(pressed); break;
            case HoldAction.Right: target.SetRight(pressed); break;
            case HoldAction.Handbrake: target.SetHandbrake(pressed); break;
        }
    }
}
