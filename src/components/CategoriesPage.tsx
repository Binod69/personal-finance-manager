import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function CategoriesPage() {
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [color, setColor] = useState("#3b82f6");
  const [showForm, setShowForm] = useState(false);

  const categories = useQuery(api.categories.list, {});
  const addCategory = useMutation(api.categories.add);
  const removeCategory = useMutation(api.categories.remove);

  const predefinedColors = [
    "#ef4444", // red
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#10b981", // emerald
    "#06b6d4", // cyan
    "#3b82f6", // blue
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#6b7280", // gray
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    // Check if category already exists
    const existingCategory = categories?.find(
      cat => cat.name.toLowerCase() === name.toLowerCase() && cat.type === type
    );
    
    if (existingCategory) {
      toast.error(`A ${type} category with this name already exists`);
      return;
    }

    try {
      await addCategory({
        name: name.trim(),
        type,
        color,
      });

      // Reset form
      setName("");
      setColor("#3b82f6");
      setShowForm(false);

      toast.success("Category added successfully!");
    } catch (error) {
      toast.error("Failed to add category");
    }
  };

  const handleDelete = async (categoryId: string, categoryName: string) => {
    if (confirm(`Are you sure you want to delete the "${categoryName}" category? This action cannot be undone.`)) {
      try {
        await removeCategory({ id: categoryId as any });
        toast.success("Category deleted successfully");
      } catch (error) {
        toast.error("Failed to delete category");
      }
    }
  };

  if (categories === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const incomeCategories = categories.filter(cat => cat.type === "income");
  const expenseCategories = categories.filter(cat => cat.type === "expense");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-1">Manage your income and expense categories</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          {showForm ? "Cancel" : "Add Category"}
        </button>
      </div>

      {/* Add Category Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Category</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="expense"
                    checked={type === "expense"}
                    onChange={(e) => setType(e.target.value as "expense")}
                    className="mr-2"
                  />
                  <span className="text-red-600">Expense</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="income"
                    checked={type === "income"}
                    onChange={(e) => setType(e.target.value as "income")}
                    className="mr-2"
                  />
                  <span className="text-green-600">Income</span>
                </label>
              </div>
            </div>

            {/* Category Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Category Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter category name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <div className="flex space-x-2 flex-wrap gap-2">
                {predefinedColors.map((colorOption) => (
                  <button
                    key={colorOption}
                    type="button"
                    onClick={() => setColor(colorOption)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      color === colorOption ? "border-gray-800 scale-110" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: colorOption }}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center space-x-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded border border-gray-300"
                />
                <span className="text-sm text-gray-600">Custom color</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Category
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Categories */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              Expense Categories
            </h2>
            <p className="text-gray-600 mt-1">{expenseCategories.length} categories</p>
          </div>

          {expenseCategories.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">No expense categories yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {expenseCategories.map((category) => (
                <div key={category._id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="font-medium text-gray-900">{category.name}</span>
                    </div>
                    <button
                      onClick={() => handleDelete(category._id, category.name)}
                      className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50 transition-colors"
                      title="Delete category"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Income Categories */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              Income Categories
            </h2>
            <p className="text-gray-600 mt-1">{incomeCategories.length} categories</p>
          </div>

          {incomeCategories.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">No income categories yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {incomeCategories.map((category) => (
                <div key={category._id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="font-medium text-gray-900">{category.name}</span>
                    </div>
                    <button
                      onClick={() => handleDelete(category._id, category.name)}
                      className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50 transition-colors"
                      title="Delete category"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
