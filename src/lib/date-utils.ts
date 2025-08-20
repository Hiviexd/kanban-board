import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import localizedFormat from "dayjs/plugin/localizedFormat";

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

/**
 * Format a date in a human-readable format
 * @param dateString - The date string or Date object to format
 * @returns Formatted date string (e.g., "January 15, 2024, 10:30 AM")
 */
export const formatDate = (dateString: string | Date): string => {
    return dayjs(dateString).format("MMMM D, YYYY, h:mm A");
};

/**
 * Format a date in a short format
 * @param dateString - The date string or Date object to format
 * @returns Short formatted date string (e.g., "Jan 15, 2024")
 */
export const formatDateShort = (dateString: string | Date): string => {
    return dayjs(dateString).format("MMM D, YYYY");
};

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 * @param dateString - The date string or Date object to format
 * @returns Relative time string or "Never" if no date provided
 */
export const formatRelativeTime = (dateString?: string | Date): string => {
    if (!dateString) return "Never";

    const date = dayjs(dateString);
    const now = dayjs();

    // If less than a minute ago, show "Just now"
    if (now.diff(date, "minute") < 1) {
        return "Just now";
    }

    // Use dayjs relative time for everything else
    return date.fromNow();
};

/**
 * Check if a date is today
 * @param dateString - The date string or Date object to check
 * @returns True if the date is today
 */
export const isToday = (dateString: string | Date): boolean => {
    return dayjs(dateString).isSame(dayjs(), "day");
};

/**
 * Get the time only (e.g., "10:30 AM")
 * @param dateString - The date string or Date object to format
 * @returns Time string
 */
export const formatTime = (dateString: string | Date): string => {
    return dayjs(dateString).format("h:mm A");
};
