using UnityEngine;

/// <summary>Starter customization hooks. Call these from garage UI buttons/sliders.</summary>
public sealed class CarCustomization : MonoBehaviour
{
    [Header("Body paint")]
    public Renderer[] paintRenderers;
    [Header("Optional wheel scale")]
    public Transform[] wheelVisuals;
    public float minWheelScale = 0.92f;
    public float maxWheelScale = 1.12f;

    private static readonly int BaseColor = Shader.PropertyToID("_BaseColor");
    private static readonly int LegacyColor = Shader.PropertyToID("_Color");
    private MaterialPropertyBlock block;

    private void Awake() => block = new MaterialPropertyBlock();

    public void SetPaintColor(Color color)
    {
        if (paintRenderers == null) return;
        foreach (Renderer renderer in paintRenderers)
        {
            if (!renderer) continue;
            renderer.GetPropertyBlock(block);
            Material shared = renderer.sharedMaterial;
            if (shared != null && shared.HasProperty(BaseColor)) block.SetColor(BaseColor, color);
            else block.SetColor(LegacyColor, color);
            renderer.SetPropertyBlock(block);
        }
    }

    /// <summary>Pass a value from 0 to 1 from a UI slider.</summary>
    public void SetWheelSize(float normalized)
    {
        float scale = Mathf.Lerp(minWheelScale, maxWheelScale, Mathf.Clamp01(normalized));
        if (wheelVisuals == null) return;
        foreach (Transform wheel in wheelVisuals)
            if (wheel) wheel.localScale = Vector3.one * scale;
    }
}
