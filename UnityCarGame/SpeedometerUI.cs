using UnityEngine;
using UnityEngine.UI;

/// <summary>Optional UI display. Assign a Text or TMP alternative in your own UI.</summary>
public sealed class SpeedometerUI : MonoBehaviour
{
    public VehicleController vehicle;
    public Text speedText;

    private void Update()
    {
        if (!vehicle || !speedText) return;
        speedText.text = Mathf.RoundToInt(vehicle.SpeedKmh) + " km/h";
    }
}
