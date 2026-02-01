using OrderBackend.Services;
using OrderBackend.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddSingleton<OrderService>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS for mobile web site
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

// Create uploads directory
var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
Directory.CreateDirectory(uploadsPath);
app.UseStaticFiles();

// Root info page
app.MapGet("/", () =>
{
    return Results.Text($@"
<!DOCTYPE html>
<html>
<head>
    <title>Order Scanner API</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }}
        .container {{ max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        h1 {{ color: #333; }}
        .endpoint {{ background: #f9f9f9; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; }}
        .method {{ color: #48bb78; font-weight: bold; }}
        code {{ background: #f0f0f0; padding: 2px 6px; border-radius: 3px; }}
        a {{ color: #667eea; text-decoration: none; }}
        a:hover {{ text-decoration: underline; }}
        .links {{ margin-top: 30px; }}
    </style>
</head>
<body>
    <div class='container'>
        <h1>📦 Order Scanner API</h1>
        <p>Backend API for the Mobile Order Scanner application.</p>
        
        <h2>API Endpoints</h2>
        
        <div class='endpoint'>
            <span class='method'>GET</span> <code>/api/orders</code>
            <p>Get all orders</p>
        </div>
        
        <div class='endpoint'>
            <span class='method'>GET</span> <code>/api/orders/{{orderNumber}}</code>
            <p>Get specific order details</p>
        </div>
        
        <div class='endpoint'>
            <span class='method'>POST</span> <code>/api/orders/{{orderNumber}}/activate</code>
            <p>Activate an order</p>
        </div>
        
        <div class='endpoint'>
            <span class='method'>POST</span> <code>/api/orders/{{orderNumber}}/photos</code>
            <p>Upload a photo for an order (multipart/form-data)</p>
        </div>
        
        <div class='links'>
            <h3>Quick Links</h3>
            <ul>
                <li><a href='/swagger/index.html'>📚 API Documentation (Swagger)</a></li>
                <li><a href='/api/orders'>📋 View All Orders</a></li>
            </ul>
        </div>
        
        <hr>
        <p><small>KRET1 - Mobile Order Scanner</small></p>
    </div>
</body>
</html>
", "text/html");
})
.WithName("InfoPage")
.WithOpenApi();

// Get all orders
app.MapGet("/api/orders", (OrderService orderService) =>
{
    return Results.Ok(orderService.GetAllOrders());
})
.WithName("GetAllOrders")
.WithOpenApi();

// Get order by number
app.MapGet("/api/orders/{orderNumber}", (string orderNumber, OrderService orderService) =>
{
    var order = orderService.GetOrder(orderNumber);
    if (order == null)
    {
        return Results.NotFound(new { message = "Order not found" });
    }
    return Results.Ok(order);
})
.WithName("GetOrder")
.WithOpenApi();

// Activate order
app.MapPost("/api/orders/{orderNumber}/activate", (string orderNumber, OrderService orderService) =>
{
    var order = orderService.ActivateOrder(orderNumber);
    if (order == null)
    {
        return Results.NotFound(new { message = "Order not found" });
    }
    return Results.Ok(order);
})
.WithName("ActivateOrder")
.WithOpenApi();

// Upload photo
app.MapPost("/api/orders/{orderNumber}/photos", async (string orderNumber, IFormFile photo, OrderService orderService) =>
{
    if (photo == null || photo.Length == 0)
    {
        return Results.BadRequest(new { message = "No photo uploaded" });
    }

    var order = orderService.GetOrder(orderNumber);
    if (order == null)
    {
        return Results.NotFound(new { message = "Order not found" });
    }

    // Save photo
    var fileName = $"{Guid.NewGuid()}_{photo.FileName}";
    var filePath = Path.Combine(uploadsPath, fileName);
    
    using (var stream = new FileStream(filePath, FileMode.Create))
    {
        await photo.CopyToAsync(stream);
    }

    orderService.AddPhoto(orderNumber, $"/uploads/{fileName}");

    return Results.Ok(new { message = "Photo uploaded successfully", photoPath = $"/uploads/{fileName}" });
})
.WithName("UploadPhoto")
.WithOpenApi()
.DisableAntiforgery();

app.Run();
