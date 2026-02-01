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
