import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

// Types for better type safety
type CategoryType = "income" | "expense";

interface CategoryFormData {
  name: string;
  type: CategoryType;
  color: string;
}

// Constants
const PREDEFINED_COLORS = [
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
] as const;

const DEFAULT_COLOR = "#3b82f6";

// Alert Dialog Component
function AlertDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  isLoading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md mx-4 animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center space-x-3">
            {isDestructive && (
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 leading-6">
                {title}
              </h3>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isDestructive
                ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Deleting...</span>
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Loading component
function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}

// Color picker component
function ColorPicker({
  selectedColor,
  onColorChange,
}: {
  selectedColor: string;
  onColorChange: (color: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Color
      </label>
      <div className="flex space-x-2 flex-wrap gap-2">
        {PREDEFINED_COLORS.map((colorOption) => (
          <button
            key={colorOption}
            type="button"
            onClick={() => onColorChange(colorOption)}
            className={`w-8 h-8 rounded-full border-2 transition-all ${
              selectedColor === colorOption
                ? "border-gray-800 scale-110"
                : "border-gray-300"
            }`}
            style={{ backgroundColor: colorOption }}
            aria-label={`Select color ${colorOption}`}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center space-x-2">
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => onColorChange(e.target.value)}
          className="w-8 h-8 rounded border border-gray-300"
          aria-label="Custom color picker"
        />
        <span className="text-sm text-gray-600">Custom color</span>
      </div>
    </div>
  );
}

// Delete icon component
function DeleteIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

// Category item component
function CategoryItem({
  category,
  onDelete,
}: {
  category: any;
  onDelete: (id: string, name: string) => Promise<void>;
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = useCallback(() => {
    setShowDeleteDialog(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    setIsDeleting(true);
    try {
      await onDelete(category._id, category.name);
      setShowDeleteDialog(false);
    } catch (error) {
      // Error handling is done in the parent component
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  }, [category._id, category.name, onDelete]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteDialog(false);
  }, []);

  return (
    <>
      <div className="p-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <span className="font-medium text-gray-900">{category.name}</span>
          </div>
          <button
            onClick={handleDeleteClick}
            className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50 transition-colors"
            title={`Delete ${category.name} category`}
            aria-label={`Delete ${category.name} category`}
          >
            <DeleteIcon />
          </button>
        </div>
      </div>

      <AlertDialog
        isOpen={showDeleteDialog}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        description={`Are you sure you want to delete the "${category.name}" category? This action cannot be undone and may affect existing transactions.`}
        confirmText="Delete Category"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </>
  );
}

// Categories list component
function CategoriesList({
  title,
  categories,
  type,
  onDelete,
}: {
  title: string;
  categories: any[];
  type: CategoryType;
  onDelete: (id: string, name: string) => Promise<void>;
}) {
  const indicatorColor = type === "expense" ? "bg-red-500" : "bg-green-500";

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <div className={`w-3 h-3 ${indicatorColor} rounded-full mr-2`} />
          {title}
        </h2>
        <p className="text-gray-600 mt-1">{categories.length} categories</p>
      </div>

      {categories.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-gray-500">No {type} categories yet</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {categories.map((category) => (
            <CategoryItem
              key={category._id}
              category={category}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Add category form component
function AddCategoryForm({
  formData,
  onFormDataChange,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  formData: CategoryFormData;
  onFormDataChange: (data: Partial<CategoryFormData>) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e).catch((error) => {
      console.error("Form submission error:", error);
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Add New Category
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category Type */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            Type
          </legend>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="expense"
                checked={formData.type === "expense"}
                onChange={(e) =>
                  onFormDataChange({ type: e.target.value as CategoryType })
                }
                className="mr-2"
                disabled={isSubmitting}
              />
              <span className="text-red-600">Expense</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="income"
                checked={formData.type === "income"}
                onChange={(e) =>
                  onFormDataChange({ type: e.target.value as CategoryType })
                }
                className="mr-2"
                disabled={isSubmitting}
              />
              <span className="text-green-600">Income</span>
            </label>
          </div>
        </fieldset>

        {/* Category Name */}
        <div>
          <label
            htmlFor="category-name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Category Name
          </label>
          <input
            type="text"
            id="category-name"
            value={formData.name}
            onChange={(e) => onFormDataChange({ name: e.target.value })}
            placeholder="Enter category name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSubmitting}
            required
          />
        </div>

        {/* Color Selection */}
        <ColorPicker
          selectedColor={formData.color}
          onColorChange={(color) => onFormDataChange({ color })}
        />

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isSubmitting || !formData.name.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Adding..." : "Add Category"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export function CategoriesPage() {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    type: "expense",
    color: DEFAULT_COLOR,
  });
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = useQuery(api.categories.list, {});
  const addCategory = useMutation(api.categories.add);
  const removeCategory = useMutation(api.categories.remove);

  // Memoized category filtering
  const { incomeCategories, expenseCategories } = useMemo(() => {
    if (!categories) return { incomeCategories: [], expenseCategories: [] };

    return {
      incomeCategories: categories.filter((cat) => cat.type === "income"),
      expenseCategories: categories.filter((cat) => cat.type === "expense"),
    };
  }, [categories]);

  // Form data change handler
  const handleFormDataChange = useCallback(
    (data: Partial<CategoryFormData>) => {
      setFormData((prev) => ({ ...prev, ...data }));
    },
    []
  );

  // Form submission handler
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!formData.name.trim()) {
        toast.error("Please enter a category name");
        return;
      }

      // Check if category already exists
      const existingCategory = categories?.find(
        (cat) =>
          cat.name.toLowerCase() === formData.name.toLowerCase() &&
          cat.type === formData.type
      );

      if (existingCategory) {
        toast.error(
          `A ${formData.type} category with this name already exists`
        );
        return;
      }

      setIsSubmitting(true);

      try {
        await addCategory({
          name: formData.name.trim(),
          type: formData.type,
          color: formData.color,
        });

        // Reset form
        setFormData({
          name: "",
          type: "expense",
          color: DEFAULT_COLOR,
        });
        setShowForm(false);

        toast.success("Category added successfully!");
      } catch (error) {
        toast.error("Failed to add category");
        console.error("Error adding category:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, categories, addCategory]
  );

  // Delete handler
  const handleDelete = useCallback(
    async (categoryId: string) => {
      try {
        await removeCategory({ id: categoryId as any });
        toast.success("Category deleted successfully");
      } catch (error) {
        toast.error("Failed to delete category");
        console.error("Error deleting category:", error);
        throw error; // Re-throw to let CategoryItem handle the loading state
      }
    },
    [removeCategory]
  );

  // Toggle form handler
  const handleToggleForm = useCallback(() => {
    setShowForm((prev) => !prev);
    if (showForm) {
      // Reset form when closing
      setFormData({
        name: "",
        type: "expense",
        color: DEFAULT_COLOR,
      });
    }
  }, [showForm]);

  if (categories === undefined) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-1">
            Manage your income and expense categories
          </p>
        </div>
        <button
          onClick={handleToggleForm}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          {showForm ? "Cancel" : "Add Category"}
        </button>
      </div>

      {/* Add Category Form */}
      {showForm && (
        <AddCategoryForm
          formData={formData}
          onFormDataChange={handleFormDataChange}
          onSubmit={handleSubmit}
          onCancel={handleToggleForm}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Categories Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoriesList
          title="Expense Categories"
          categories={expenseCategories}
          type="expense"
          onDelete={handleDelete}
        />

        <CategoriesList
          title="Income Categories"
          categories={incomeCategories}
          type="income"
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
