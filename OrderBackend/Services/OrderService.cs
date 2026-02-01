using OrderBackend.Models;

namespace OrderBackend.Services;

public class OrderService
{
    private readonly Dictionary<string, Order> _orders = new();

    public OrderService()
    {
        // Initialize with some sample orders
        _orders["ORD12345"] = new Order
        {
            OrderNumber = "ORD12345",
            CustomerName = "John Doe",
            ProductDescription = "Laptop Computer - Dell XPS 15",
            IsActivated = false
        };
        
        _orders["ORD67890"] = new Order
        {
            OrderNumber = "ORD67890",
            CustomerName = "Jane Smith",
            ProductDescription = "Wireless Mouse and Keyboard Set",
            IsActivated = false
        };
    }

    public Order? GetOrder(string orderNumber)
    {
        _orders.TryGetValue(orderNumber, out var order);
        return order;
    }

    public Order? ActivateOrder(string orderNumber)
    {
        if (_orders.TryGetValue(orderNumber, out var order))
        {
            order.IsActivated = true;
            order.ActivatedAt = DateTime.UtcNow;
            return order;
        }
        return null;
    }

    public bool AddPhoto(string orderNumber, string photoPath)
    {
        if (_orders.TryGetValue(orderNumber, out var order))
        {
            order.PhotoPaths.Add(photoPath);
            return true;
        }
        return false;
    }

    public IEnumerable<Order> GetAllOrders()
    {
        return _orders.Values;
    }
}
