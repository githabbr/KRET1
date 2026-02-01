namespace OrderBackend.Models;

public class Order
{
    public string OrderNumber { get; set; } = string.Empty;
    public bool IsActivated { get; set; }
    public DateTime? ActivatedAt { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string ProductDescription { get; set; } = string.Empty;
    public List<string> PhotoPaths { get; set; } = new();
}

public class ActivateOrderRequest
{
    public string OrderNumber { get; set; } = string.Empty;
}

public class UploadPhotoRequest
{
    public string OrderNumber { get; set; } = string.Empty;
    public IFormFile? Photo { get; set; }
}
