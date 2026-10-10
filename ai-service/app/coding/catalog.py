"""
ORBIT AI — DSA Topics & LeetCode Catalogue
Contains comprehensive curricular data covering 10 core DSA topics,
verified official LeetCode problems, starter code for C++ and Python,
and detailed 7-part pedagogical explanations.
"""

from typing import Dict, Any, List, Optional

DSA_TOPICS: List[Dict[str, Any]] = [
    {
        "id": "arrays",
        "name": "Arrays",
        "tagline": "Contiguous memory, direct indexing, Two Pointers, and Sliding Window",
        "description": "Arrays store elements in contiguous memory locations, allowing O(1) random access by index. Mastering arrays is essential for two pointers, sliding windows, and prefix sums.",
        "patterns": ["Two Pointers", "Sliding Window", "Prefix Sums", "Dutch National Flag"],
        "containers": {
            "cpp": "std::vector<T> (dynamic), std::array<T, N> (static)",
            "python": "list (dynamic array)"
        },
        "time_complexities": {
            "Access": "O(1)",
            "Search": "O(N)",
            "Insertion (End)": "O(1) amortized",
            "Insertion (Middle)": "O(N)",
            "Deletion (Middle)": "O(N)"
        }
    },
    {
        "id": "strings",
        "name": "Strings",
        "tagline": "Character sequences, ASCII/Unicode encoding, substrings, and anagrams",
        "description": "Strings are sequences of characters. In Python they are immutable, while in C++ std::string is mutable. Fundamental patterns include anagram frequency mapping and palindrome expansion.",
        "patterns": ["Character Frequency Map", "Two Pointers Palindrome", "KMP / Rolling Hash", "Sliding Window"],
        "containers": {
            "cpp": "std::string, std::string_view (C++17 zero-copy)",
            "python": "str (immutable), list of chars for in-place edits"
        },
        "time_complexities": {
            "Length": "O(1)",
            "Concatenation": "O(N + M)",
            "Substring": "O(K)"
        }
    },
    {
        "id": "hashing",
        "name": "Hashing",
        "tagline": "O(1) average lookup, key-value mappings, and frequency counting",
        "description": "Hash tables map keys to values using a hash function. They turn O(N) linear scans into O(1) average-time lookups. Essential for frequency counting and complement checks.",
        "patterns": ["Seen Set for Membership", "Frequency Counting Map", "Two Sum Complement Map", "Prefix Sum with Hash Map"],
        "containers": {
            "cpp": "std::unordered_map<K, V>, std::unordered_set<K>",
            "python": "dict, set, collections.Counter, collections.defaultdict"
        },
        "time_complexities": {
            "Insert": "O(1) avg / O(N) worst",
            "Lookup": "O(1) avg / O(N) worst",
            "Delete": "O(1) avg / O(N) worst"
        }
    },
    {
        "id": "linked-lists",
        "name": "Linked Lists",
        "tagline": "Node-pointer chains, dynamic memory, and pointer manipulation",
        "description": "Linked lists store elements in separate nodes where each node contains data and a pointer to the next node. Key patterns include Fast & Slow pointers (Floyd's Cycle Finding) and recursive reversal.",
        "patterns": ["Fast & Slow Pointers (Tortoise & Hare)", "In-Place List Reversal", "Dummy Head Pointer", "Merge Two Sorted Lists"],
        "containers": {
            "cpp": "Custom struct ListNode { int val; ListNode* next; };",
            "python": "class ListNode: def __init__(self, val=0, next=None): self.val = val; self.next = next"
        },
        "time_complexities": {
            "Access": "O(N)",
            "Insert at Head": "O(1)",
            "Insert at Tail (with tail ptr)": "O(1)",
            "Search": "O(N)"
        }
    },
    {
        "id": "stacks",
        "name": "Stacks",
        "tagline": "LIFO (Last In First Out) ordering, parsing, and monotonic stacks",
        "description": "Stacks maintain Last-In-First-Out ordering. They are ideal for tracking nested structures (parentheses matching), backtracking, call stacks, and next greater element queries.",
        "patterns": ["Matching Parentheses", "Monotonic Increasing/Decreasing Stack", "Evaluation of Reverse Polish Notation"],
        "containers": {
            "cpp": "std::stack<T> (backed by std::deque or std::vector)",
            "python": "list (append / pop), collections.deque"
        },
        "time_complexities": {
            "Push": "O(1)",
            "Pop": "O(1)",
            "Top / Peek": "O(1)"
        }
    },
    {
        "id": "queues",
        "name": "Queues",
        "tagline": "FIFO (First In First Out) ordering, BFS traversal, and sliding windows",
        "description": "Queues maintain First-In-First-Out ordering. Fundamental for Breadth-First Search (BFS) in trees and graphs, task scheduling, and sliding window maximum via monotonic deques.",
        "patterns": ["Breadth-First Search Queue", "Sliding Window Maximum (Monotonic Deque)", "Circular Queue"],
        "containers": {
            "cpp": "std::queue<T>, std::deque<T> (double-ended)",
            "python": "collections.deque (append / popleft)"
        },
        "time_complexities": {
            "Enqueue": "O(1)",
            "Dequeue": "O(1)",
            "Front": "O(1)"
        }
    },
    {
        "id": "binary-search",
        "name": "Binary Search",
        "tagline": "Logarithmic O(log N) search on monotonic search spaces",
        "description": "Binary search halves the search space at each step. Beyond sorted arrays, it applies to any monotonic predicate (Binary Search on Answer / Optimization problems).",
        "patterns": ["Standard Sorted Array Search", "First / Last Occurrence", "Search in Rotated Sorted Array", "Binary Search on Value Range"],
        "containers": {
            "cpp": "std::lower_bound, std::upper_bound, std::binary_search",
            "python": "bisect.bisect_left, bisect.bisect_right"
        },
        "time_complexities": {
            "Search": "O(log N)",
            "Space": "O(1) iterative / O(log N) recursive"
        }
    },
    {
        "id": "trees",
        "name": "Trees",
        "tagline": "Hierarchical structures, Binary Search Trees, DFS, and BFS",
        "description": "Trees are acyclic connected graphs where each node has at most one parent. Key topics include Pre/In/Post-order DFS traversals, Level-order BFS, and BST search properties.",
        "patterns": ["Depth-First Search (Pre/In/Post order)", "Breadth-First Search Level Order", "BST Property Invariant", "Lowest Common Ancestor"],
        "containers": {
            "cpp": "Custom struct TreeNode { int val; TreeNode *left; TreeNode *right; };",
            "python": "class TreeNode: def __init__(self, val=0, left=None, right=None): self.val = val; self.left = left; self.right = right"
        },
        "time_complexities": {
            "Traversal": "O(N)",
            "BST Search (Balanced)": "O(log N)",
            "BST Search (Degenerate)": "O(N)"
        }
    },
    {
        "id": "graphs",
        "name": "Graphs",
        "tagline": "Nodes and edges, DFS, BFS, cycle detection, and connectivity",
        "description": "Graphs model networks of vertices and edges. Core algorithms include Depth-First Search (DFS) for paths/components and Breadth-First Search (BFS) for unweighted shortest paths.",
        "patterns": ["DFS Connected Components (Grid Island)", "BFS Shortest Path", "Topological Sort (Kahn's)", "Cycle Detection (Visited array / 3-coloring)"],
        "containers": {
            "cpp": "std::vector<std::vector<int>> (Adjacency List), std::unordered_map<int, std::vector<int>>",
            "python": "dict of lists: {u: [v1, v2]}, collections.defaultdict(list)"
        },
        "time_complexities": {
            "BFS/DFS Time": "O(V + E)",
            "BFS/DFS Space": "O(V)"
        }
    },
    {
        "id": "dynamic-programming",
        "name": "Dynamic Programming",
        "tagline": "Overlapping subproblems, optimal substructure, memoization & tabulation",
        "description": "Dynamic Programming solves optimization problems by breaking them into overlapping subproblems, solving each subproblem once, and caching results via memoization or bottom-up tabulation.",
        "patterns": ["1D State (Fibonacci, Climbing Stairs, House Robber)", "0/1 Knapsack & Unbounded Knapsack (Coin Change)", "Longest Common Subsequence", "Interval DP"],
        "containers": {
            "cpp": "std::vector<int> (1D table), std::vector<std::vector<int>> (2D table)",
            "python": "list of ints, @functools.lru_cache(None)"
        },
        "time_complexities": {
            "Time": "O(Number of Subproblems * Time per Subproblem)",
            "Space": "O(Table Size) often reducible to O(1) or O(W)"
        }
    },
    {
        "id": "two-pointers-sliding-window",
        "name": "Two Pointers & Sliding Window",
        "tagline": "Converging / fast-slow pointers and dynamic/fixed window expansion",
        "description": "Technique where two pointer indices traverse a sequence either in opposing directions (converging) or in the same direction (sliding window). Turns O(N^2) brute force nested loops into linear O(N) passes.",
        "patterns": ["Opposite Direction (Two Sum II, Container With Most Water)", "Same Direction (Fast & Slow, Remove Duplicates)", "Dynamic Sliding Window (Longest Substring)", "Fixed Window (Max Sum Subarray)"],
        "containers": {
            "cpp": "std::vector<int>, std::string with size_t left, right indices",
            "python": "list, str with int left, right indices"
        },
        "time_complexities": {
            "Traversal": "O(N) amortized",
            "Space": "O(1) auxiliary"
        }
    },
    {
        "id": "heaps",
        "name": "Heaps & Priority Queues",
        "tagline": "Binary heaps, min/max priority queues, Top-K elements, and streaming medians",
        "description": "A heap is a specialized tree-based data structure satisfying the heap invariant: in a min-heap, the parent node is less than or equal to its children; in a max-heap, the parent is greater than or equal to its children. Fundamental for priority scheduling and selection algorithms.",
        "patterns": ["Top-K Elements", "K-way Merge", "Two Heaps for Running Median", "Dijkstra Shortest Path"],
        "containers": {
            "cpp": "std::priority_queue<T> (max-heap), std::priority_queue<T, std::vector<T>, std::greater<T>> (min-heap)",
            "python": "heapq (min-heap), heapq._heapify_max"
        },
        "time_complexities": {
            "Find Min/Max": "O(1)",
            "Push": "O(log N)",
            "Pop": "O(log N)",
            "Heapify": "O(N)"
        }
    },
    {
        "id": "recursion-backtracking",
        "name": "Recursion & Backtracking",
        "tagline": "Systematic state-space tree exploration, choice-explore-unchoose pattern",
        "description": "Backtracking incrementally builds candidates to solutions and abandons ('backtracks') a candidate as soon as it determines it cannot possibly lead to a valid solution. Essential for combinatorial generation.",
        "patterns": ["Subsets / Power Set", "Permutations", "Combinations (N-Queens, Sudoku)", "Word Search on Grid"],
        "containers": {
            "cpp": "std::vector<T> passed by reference with push_back / pop_back",
            "python": "list with append / pop passed to recursive helper"
        },
        "time_complexities": {
            "Subsets": "O(2^N)",
            "Permutations": "O(N!)",
            "Call Stack Space": "O(N)"
        }
    },
    {
        "id": "greedy",
        "name": "Greedy Algorithms",
        "tagline": "Locally optimal choices that yield a globally optimal solution",
        "description": "Greedy algorithms make the best local decision at each step with the assumption that this leads to the global optimum. Unlike dynamic programming, greedy algorithms never reconsider previous choices.",
        "patterns": ["Interval Scheduling", "Jump Game Reachability", "Huffman Coding", "Gas Station Circuit"],
        "containers": {
            "cpp": "std::vector<T> with std::sort and custom comparator",
            "python": "list.sort(key=...) with iterative scan"
        },
        "time_complexities": {
            "Greedy Step": "O(1) to O(log N)",
            "Overall (Sorting dominated)": "O(N log N)",
            "Space": "O(1) to O(N)"
        }
    },
    {
        "id": "intervals",
        "name": "Intervals",
        "tagline": "Overlapping ranges, coordinate compression, meeting rooms and sweep-line",
        "description": "Interval problems involve ranges [start, end]. The canonical technique is sorting by start time, then iterating to check for overlaps or merge adjacent segments.",
        "patterns": ["Merge Overlapping Intervals", "Insert Interval", "Non-overlapping Intervals", "Meeting Rooms (Min Conference Rooms)"],
        "containers": {
            "cpp": "std::vector<std::vector<int>> sorted by interval[0]",
            "python": "list of pairs sorted by x[0]"
        },
        "time_complexities": {
            "Sorting": "O(N log N)",
            "Linear Merge Pass": "O(N)",
            "Space": "O(N)"
        }
    }
]

LEETCODE_PROBLEMS: List[Dict[str, Any]] = [
    # 1. Two Sum
    {
        "id": "two-sum",
        "leetcode_num": 1,
        "title": "Two Sum",
        "difficulty": "Easy",
        "topic_id": "hashing",
        "official_url": "https://leetcode.com/problems/two-sum/",
        "summary": "Find two indices in an array such that their values add up to a specific target.",
        "description": (
            "Given an array of integers `nums` and an integer `target`, return indices of the two numbers "
            "such that they add up to `target`.\n\n"
            "You may assume that each input would have exactly one solution, and you may not use the same element twice.\n\n"
            "You can return the answer in any order."
        ),
        "constraints": [
            "2 <= nums.length <= 10^4",
            "-10^9 <= nums[i] <= 10^9",
            "-10^9 <= target <= 10^9",
            "Only one valid answer exists."
        ],
        "examples": [
            {
                "input": "nums = [2, 7, 11, 15], target = 9",
                "output": "[0, 1]",
                "explanation": "Because nums[0] + nums[1] == 2 + 7 == 9, we return [0, 1]."
            },
            {
                "input": "nums = [3, 2, 4], target = 6",
                "output": "[1, 2]",
                "explanation": "nums[1] + nums[2] == 2 + 4 == 6, so we return [1, 2]."
            },
            {
                "input": "nums = [3, 3], target = 6",
                "output": "[0, 1]",
                "explanation": "nums[0] + nums[1] == 3 + 3 == 6, so return [0, 1]."
            }
        ],
        "starter_code": {
            "cpp": (
                "#include <vector>\n"
                "#include <unordered_map>\n\n"
                "class Solution {\n"
                "public:\n"
                "    std::vector<int> twoSum(std::vector<int>& nums, int target) {\n"
                "        // TODO: Store seen numbers in an unordered_map: value -> index\n"
                "        // For each num, check if (target - num) exists in the map.\n"
                "        return {};\n"
                "    }\n"
                "};\n"
            ),
            "python": (
                "from typing import List\n\n"
                "class Solution:\n"
                "    def twoSum(self, nums: List[int], target: int) -> List[int]:\n"
                "        # TODO: Store seen values in a dictionary: value -> index\n"
                "        # For each number, calculate complement = target - num\n"
                "        return []\n"
            )
        },
        "solution_code": {
            "cpp": (
                "#include <vector>\n"
                "#include <unordered_map>\n\n"
                "class Solution {\n"
                "public:\n"
                "    std::vector<int> twoSum(std::vector<int>& nums, int target) {\n"
                "        std::unordered_map<int, int> seen;\n"
                "        for (int i = 0; i < static_cast<int>(nums.size()); ++i) {\n"
                "            int complement = target - nums[i];\n"
                "            if (seen.find(complement) != seen.end()) {\n"
                "                return {seen[complement], i};\n"
                "            }\n"
                "            seen[nums[i]] = i;\n"
                "        }\n"
                "        return {};\n"
                "    }\n"
                "};\n"
            ),
            "python": (
                "from typing import List\n\n"
                "class Solution:\n"
                "    def twoSum(self, nums: List[int], target: int) -> List[int]:\n"
                "        seen = {}\n"
                "        for i, num in enumerate(nums):\n"
                "            complement = target - num\n"
                "            if complement in seen:\n"
                "                return [seen[complement], i]\n"
                "            seen[num] = i\n"
                "        return []\n"
            )
        },
        "structured_explanation": {
            "problem_understanding": (
                "We need to find two distinct indices in an array whose values sum to a given target.\n"
                "- Input: Array of integers `nums`, single integer `target`.\n"
                "- Output: List of two indices `[i, j]` with `i != j` such that `nums[i] + nums[j] == target`.\n"
                "- Key Constraints: Exactly one valid solution exists; cannot use the same element twice."
            ),
            "approach": (
                "1. Brute Force (O(N^2) Time, O(1) Space):\n"
                "   Compare every pair (i, j) with nested loops. If nums[i] + nums[j] == target, return [i, j].\n\n"
                "2. Optimal One-Pass Hash Map (O(N) Time, O(N) Space):\n"
                "   Instead of looking forward for a matching number, remember what we have already seen.\n"
                "   For each number x at index i, its required pair is complement = target - x.\n"
                "   Check if complement is already stored in our hash map. If yes, we found our pair!\n"
                "   If no, insert x -> i into the hash map and continue."
            ),
            "pseudocode": (
                "Initialize hash_map seen = {}\n"
                "FOR each index i, value num in nums:\n"
                "    complement = target - num\n"
                "    IF complement in seen:\n"
                "        RETURN [seen[complement], i]\n"
                "    seen[num] = i\n"
                "RETURN []"
            ),
            "line_by_line": {
                "cpp": [
                    "std::unordered_map<int, int> seen: Allocates a hash table mapping number value -> index.",
                    "for (int i = 0; i < nums.size(); ++i): Iterates through array elements once.",
                    "int complement = target - nums[i]: Computes the exact counterpart needed to reach the target.",
                    "if (seen.find(complement) != seen.end()): O(1) average lookup checking if counterpart was already seen.",
                    "return {seen[complement], i}: Returns the counterpart index and current index.",
                    "seen[nums[i]] = i: Stores current value and index for future iterations."
                ],
                "python": [
                    "seen = {}: Initializes an empty hash map (dict).",
                    "for i, num in enumerate(nums): Unpacks index and value simultaneously.",
                    "complement = target - num: Calculates required partner number.",
                    "if complement in seen: O(1) average dictionary key membership test.",
                    "return [seen[complement], i]: Returns list containing both indices.",
                    "seen[num] = i: Records current number and its index."
                ]
            },
            "dry_run": [
                {"step": 1, "i": 0, "num": 2, "complement": "9 - 2 = 7", "in_map": "No", "seen_after": "{2: 0}"},
                {"step": 2, "i": 1, "num": 7, "complement": "9 - 7 = 2", "in_map": "Yes! seen[2] is 0", "seen_after": "Return [0, 1]"}
            ],
            "complexity": {
                "time": "O(N) — We traverse the list of N elements exactly once. Each hash map lookup and insertion takes O(1) on average.",
                "space": "O(N) — In the worst case, the hash map stores up to N elements before finding the solution."
            }
        }
    },

    # 2. Best Time to Buy and Sell Stock
    {
        "id": "best-time-to-buy-and-sell-stock",
        "leetcode_num": 121,
        "title": "Best Time to Buy and Sell Stock",
        "difficulty": "Easy",
        "topic_id": "arrays",
        "official_url": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
        "summary": "Maximize profit by choosing a single day to buy and a later day to sell.",
        "description": (
            "You are given an array `prices` where `prices[i]` is the price of a given stock on the `i-th` day.\n\n"
            "You want to maximize your profit by choosing a single day to buy one stock and choosing a different day "
            "in the future to sell that stock.\n\n"
            "Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0."
        ),
        "constraints": [
            "1 <= prices.length <= 10^5",
            "0 <= prices[i] <= 10^4"
        ],
        "examples": [
            {
                "input": "prices = [7, 1, 5, 3, 6, 4]",
                "output": "5",
                "explanation": "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6 - 1 = 5."
            },
            {
                "input": "prices = [7, 6, 4, 3, 1]",
                "output": "0",
                "explanation": "In this case, no transactions are done and max profit = 0."
            }
        ],
        "starter_code": {
            "cpp": (
                "#include <vector>\n"
                "#include <algorithm>\n\n"
                "class Solution {\n"
                "public:\n"
                "    int maxProfit(std::vector<int>& prices) {\n"
                "        // TODO: Track the minimum buying price seen so far\n"
                "        // Calculate profit if sold today, update max_profit\n"
                "        return 0;\n"
                "    }\n"
                "};\n"
            ),
            "python": (
                "from typing import List\n\n"
                "class Solution:\n"
                "    def maxProfit(self, prices: List[int]) -> int:\n"
                "        # TODO: Track minimum buying price seen so far\n"
                "        # Update max profit if selling today yields higher return\n"
                "        return 0\n"
            )
        },
        "solution_code": {
            "cpp": (
                "#include <vector>\n"
                "#include <algorithm>\n\n"
                "class Solution {\n"
                "public:\n"
                "    int maxProfit(std::vector<int>& prices) {\n"
                "        int min_price = prices.empty() ? 0 : prices[0];\n"
                "        int max_profit = 0;\n"
                "        for (int p : prices) {\n"
                "            if (p < min_price) {\n"
                "                min_price = p;\n"
                "            } else {\n"
                "                max_profit = std::max(max_profit, p - min_price);\n"
                "            }\n"
                "        }\n"
                "        return max_profit;\n"
                "    }\n"
                "};\n"
            ),
            "python": (
                "from typing import List\n\n"
                "class Solution:\n"
                "    def maxProfit(self, prices: List[int]) -> int:\n"
                "        min_price = float('inf')\n"
                "        max_profit = 0\n"
                "        for p in prices:\n"
                "            if p < min_price:\n"
                "                min_price = p\n"
                "            else:\n"
                "                max_profit = max(max_profit, p - min_price)\n"
                "        return max_profit\n"
            )
        },
        "structured_explanation": {
            "problem_understanding": (
                "Find the maximum difference prices[j] - prices[i] where j > i.\n"
                "If prices are strictly decreasing, you cannot make a positive profit, so return 0."
            ),
            "approach": (
                "Optimal One-Pass (Kadane's / Greedy principle):\n"
                "Maintain two running variables as we scan through the array:\n"
                "1. `min_price`: The lowest price observed from day 0 up to current day.\n"
                "2. `max_profit`: The highest profit achieved so far.\n"
                "For each price, update `min_price = min(min_price, price)`, and update `max_profit = max(max_profit, price - min_price)`."
            ),
            "pseudocode": (
                "min_price = infinity\n"
                "max_profit = 0\n"
                "FOR price in prices:\n"
                "    IF price < min_price: min_price = price\n"
                "    ELSE: max_profit = MAX(max_profit, price - min_price)\n"
                "RETURN max_profit"
            ),
            "line_by_line": {
                "cpp": [
                    "int min_price = prices[0]: Starts with the first day's price as baseline minimum.",
                    "int max_profit = 0: Initializes profit to 0 (default if no profit possible).",
                    "if (p < min_price) min_price = p: Discovered a cheaper day to buy in the past.",
                    "max_profit = std::max(max_profit, p - min_price): Evaluates selling today vs previous best."
                ],
                "python": [
                    "min_price = float('inf'): Initializes lowest price to positive infinity.",
                    "max_profit = 0: Ensures we never return a negative loss.",
                    "if p < min_price: Sets the new lowest possible purchase price.",
                    "max_profit = max(max_profit, p - min_price): Greedily stores the largest spread."
                ]
            },
            "dry_run": [
                {"step": 1, "price": 7, "min_price": 7, "profit_today": 0, "max_profit": 0},
                {"step": 2, "price": 1, "min_price": 1, "profit_today": 0, "max_profit": 0},
                {"step": 3, "price": 5, "min_price": 1, "profit_today": 4, "max_profit": 4},
                {"step": 4, "price": 3, "min_price": 1, "profit_today": 2, "max_profit": 4},
                {"step": 5, "price": 6, "min_price": 1, "profit_today": 5, "max_profit": 5},
                {"step": 6, "price": 4, "min_price": 1, "profit_today": 3, "max_profit": 5}
            ],
            "complexity": {
                "time": "O(N) — Single pass through the prices array.",
                "space": "O(1) — Uses only two scalar tracking variables."
            }
        }
    },

    # 3. Valid Anagram
    {
        "id": "valid-anagram",
        "leetcode_num": 242,
        "title": "Valid Anagram",
        "difficulty": "Easy",
        "topic_id": "strings",
        "official_url": "https://leetcode.com/problems/valid-anagram/",
        "summary": "Check whether two strings contain the exact same character frequencies.",
        "description": (
            "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.\n\n"
            "An **Anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, "
            "typically using all the original letters exactly once."
        ),
        "constraints": [
            "1 <= s.length, t.length <= 5 * 10^4",
            "`s` and `t` consist of lowercase English letters."
        ],
        "examples": [
            {
                "input": "s = \"anagram\", t = \"nagaram\"",
                "output": "true",
                "explanation": "Both strings contain 3 'a's, 1 'n', 1 'g', 1 'r', 1 'm'."
            },
            {
                "input": "s = \"rat\", t = \"car\"",
                "output": "false",
                "explanation": "'r' matches, but 't' does not match 'c'."
            }
        ],
        "starter_code": {
            "cpp": (
                "#include <string>\n"
                "#include <vector>\n\n"
                "class Solution {\n"
                "public:\n"
                "    bool isAnagram(std::string s, std::string t) {\n"
                "        // TODO: Compare lengths; if different, return false\n"
                "        // Count letter frequencies with an array of size 26\n"
                "        return false;\n"
                "    }\n"
                "};\n"
            ),
            "python": (
                "class Solution:\n"
                "    def isAnagram(self, s: str, t: str) -> bool:\n"
                "        # TODO: Compare lengths first\n"
                "        # Count frequency of each character or use collections.Counter\n"
                "        return False\n"
            )
        },
        "solution_code": {
            "cpp": (
                "#include <string>\n"
                "#include <vector>\n\n"
                "class Solution {\n"
                "public:\n"
                "    bool isAnagram(std::string s, std::string t) {\n"
                "        if (s.length() != t.length()) return false;\n"
                "        std::vector<int> counts(26, 0);\n"
                "        for (char c : s) counts[c - 'a']++;\n"
                "        for (char c : t) {\n"
                "            if (--counts[c - 'a'] < 0) return false;\n"
                "        }\n"
                "        return true;\n"
                "    }\n"
                "};\n"
            ),
            "python": (
                "class Solution:\n"
                "    def isAnagram(self, s: str, t: str) -> bool:\n"
                "        if len(s) != len(t): return False\n"
                "        counts = {}\n"
                "        for ch in s:\n"
                "            counts[ch] = counts.get(ch, 0) + 1\n"
                "        for ch in t:\n"
                "            if ch not in counts or counts[ch] == 0:\n"
                "                return False\n"
                "            counts[ch] -= 1\n"
                "        return True\n"
            )
        },
        "structured_explanation": {
            "problem_understanding": (
                "Determine if string `t` can be formed by reordering characters of string `s`.\n"
                "They must have identical lengths and identical character counts."
            ),
            "approach": (
                "1. Sorting Approach: Sort both strings and check if s == t. Time O(N log N), Space O(1) or O(N).\n"
                "2. Optimal Frequency Array (Fixed size 26): Since all characters are lowercase English letters, "
                "we can use a static array of size 26. Increment counts for letters in `s`, decrement for `t`. "
                "If any count goes negative, return false. Time O(N), Space O(1)."
            ),
            "pseudocode": (
                "IF len(s) != len(t): RETURN false\n"
                "counts = array of size 26 initialized to 0\n"
                "FOR char in s: counts[char - 'a']++\n"
                "FOR char in t:\n"
                "    counts[char - 'a']--\n"
                "    IF counts[char - 'a'] < 0: RETURN false\n"
                "RETURN true"
            ),
            "line_by_line": {
                "cpp": [
                    "if (s.length() != t.length()) return false: Early exit if length mismatch.",
                    "std::vector<int> counts(26, 0): Fixed-size vector for alphabet indexing.",
                    "counts[c - 'a']++: Maps ASCII char ('a'=97) to 0-25 index.",
                    "if (--counts[c - 'a'] < 0): Decrements count and flags any deficit immediately."
                ],
                "python": [
                    "if len(s) != len(t): Fast check before iterating.",
                    "counts[ch] = counts.get(ch, 0) + 1: Tally counts for first string.",
                    "if ch not in counts or counts[ch] == 0: Rejects unseen or overused character."
                ]
            },
            "dry_run": [
                {"step": "Initial", "s": "rat", "t": "car"},
                {"step": "After s", "counts": "{'r': 1, 'a': 1, 't': 1}"},
                {"step": "Check t[0]='c'", "condition": "'c' not in counts", "result": "Return False"}
            ],
            "complexity": {
                "time": "O(N) — Traversing each string of length N once.",
                "space": "O(1) — The frequency array size is bounded by 26 characters (constant alphabet size)."
            }
        }
    },

    # 4. Valid Parentheses
    {
        "id": "valid-parentheses",
        "leetcode_num": 20,
        "title": "Valid Parentheses",
        "difficulty": "Easy",
        "topic_id": "stacks",
        "official_url": "https://leetcode.com/problems/valid-parentheses/",
        "summary": "Determine if brackets in a string close in the correct order using a stack.",
        "description": (
            "Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, "
            "determine if the input string is valid.\n\n"
            "An input string is valid if:\n"
            "1. Open brackets must be closed by the same type of brackets.\n"
            "2. Open brackets must be closed in the correct order.\n"
            "3. Every close bracket has a corresponding open bracket of the same type."
        ),
        "constraints": [
            "1 <= s.length <= 10^4",
            "`s` consists of parentheses only `'()[]{}'`."
        ],
        "examples": [
            {
                "input": "s = \"()\"",
                "output": "true",
                "explanation": "Opening bracket is closed by matching type."
            },
            {
                "input": "s = \"()[]{}\"",
                "output": "true",
                "explanation": "All bracket pairs open and close in valid sequential order."
            },
            {
                "input": "s = \"(]\"",
                "output": "false",
                "explanation": "Mismatched closing bracket type."
            }
        ],
        "starter_code": {
            "cpp": (
                "#include <string>\n"
                "#include <stack>\n\n"
                "class Solution {\n"
                "public:\n"
                "    bool isValid(std::string s) {\n"
                "        // TODO: Push opening brackets onto stack\n"
                "        // When closing bracket is encountered, verify top of stack matches\n"
                "        return false;\n"
                "    }\n"
                "};\n"
            ),
            "python": (
                "class Solution:\n"
                "    def isValid(self, s: str) -> bool:\n"
                "        # TODO: Use list as stack\n"
                "        # Push opening brackets, pop and verify on closing brackets\n"
                "        return False\n"
            )
        },
        "solution_code": {
            "cpp": (
                "#include <string>\n"
                "#include <stack>\n\n"
                "class Solution {\n"
                "public:\n"
                "    bool isValid(std::string s) {\n"
                "        std::stack<char> st;\n"
                "        for (char c : s) {\n"
                "            if (c == '(') st.push(')');\n"
                "            else if (c == '{') st.push('}');\n"
                "            else if (c == '[') st.push(']');\n"
                "            else {\n"
                "                if (st.empty() || st.top() != c) return false;\n"
                "                st.pop();\n"
                "            }\n"
                "        }\n"
                "        return st.empty();\n"
                "    }\n"
                "};\n"
            ),
            "python": (
                "class Solution:\n"
                "    def isValid(self, s: str) -> bool:\n"
                "        stack = []\n"
                "        mapping = {')': '(', '}': '{', ']': '['}\n"
                "        for char in s:\n"
                "            if char in mapping:\n"
                "                top_element = stack.pop() if stack else '#'\n"
                "                if mapping[char] != top_element:\n"
                "                    return False\n"
                "            else:\n"
                "                stack.append(char)\n"
                "        return not stack\n"
            )
        },
        "structured_explanation": {
            "problem_understanding": (
                "Every closing bracket must match the most recently opened unmatched bracket (LIFO property).\n"
                "If the string ends with unclosed brackets, or a closing bracket appears with no open bracket, it is invalid."
            ),
            "approach": (
                "LIFO Stack Pattern:\n"
                "- When an opening bracket is seen, push its matching closer onto the stack.\n"
                "- When a closing bracket is seen, pop from the stack and verify that it matches.\n"
                "- At the end of the string, the stack must be completely empty."
            ),
            "pseudocode": (
                "stack = []\n"
                "FOR char in s:\n"
                "    IF char in ['(', '{', '[']:\n"
                "        stack.push(matching_closer(char))\n"
                "    ELSE:\n"
                "        IF stack is empty OR stack.pop() != char:\n"
                "            RETURN false\n"
                "RETURN stack is empty"
            ),
            "line_by_line": {
                "cpp": [
                    "std::stack<char> st: Instantiates standard LIFO stack.",
                    "if (c == '(') st.push(')'): Elegant trick pushing the expected closing char directly.",
                    "if (st.empty() || st.top() != c) return false: Checks for premature close or mismatch.",
                    "st.pop(): Clears matched pair from stack.",
                    "return st.empty(): Valid only if no trailing unmatched opening brackets remain."
                ],
                "python": [
                    "stack = []: Uses standard list with append() and pop().",
                    "mapping = {')': '(', '}': '{', ']': '['}: Maps closers to required openers.",
                    "top_element = stack.pop() if stack else '#': Safe pop with dummy fallback.",
                    "return not stack: Returns True if stack is empty."
                ]
            },
            "dry_run": [
                {"step": 1, "char": "(", "stack": "['(']"},
                {"step": 2, "char": "[", "stack": "['(', '[']"},
                {"step": 3, "char": "]", "pop": "[", "matches": "Yes", "stack": "['(']"},
                {"step": 4, "char": ")", "pop": "(", "matches": "Yes", "stack": "[]"}
            ],
            "complexity": {
                "time": "O(N) — Single pass over string length N.",
                "space": "O(N) — Stack holds up to N elements if all brackets are opening."
            }
        }
    },

    # 5. Binary Search
    {
        "id": "binary-search",
        "leetcode_num": 704,
        "title": "Binary Search",
        "difficulty": "Easy",
        "topic_id": "binary-search",
        "official_url": "https://leetcode.com/problems/binary-search/",
        "summary": "Search a target value inside a sorted ascending array in O(log N) time.",
        "description": (
            "Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, "
            "write a function to search `target` in `nums`.\n\n"
            "If `target` exists, then return its index. Otherwise, return `-1`.\n\n"
            "You must write an algorithm with `O(log n)` runtime complexity."
        ),
        "constraints": [
            "1 <= nums.length <= 10^4",
            "-10^4 < nums[i], target < 10^4",
            "All the integers in `nums` are unique.",
            "`nums` is sorted in ascending order."
        ],
        "examples": [
            {
                "input": "nums = [-1, 0, 3, 5, 9, 12], target = 9",
                "output": "4",
                "explanation": "9 exists in nums and its index is 4."
            },
            {
                "input": "nums = [-1, 0, 3, 5, 9, 12], target = 2",
                "output": "-1",
                "explanation": "2 does not exist in nums so return -1."
            }
        ],
        "starter_code": {
            "cpp": (
                "#include <vector>\n\n"
                "class Solution {\n"
                "public:\n"
                "    int search(std::vector<int>& nums, int target) {\n"
                "        // TODO: Maintain low and high pointers\n"
                "        // Calculate mid = low + (high - low) / 2 to prevent integer overflow\n"
                "        return -1;\n"
                "    }\n"
                "};\n"
            ),
            "python": (
                "from typing import List\n\n"
                "class Solution:\n"
                "    def search(self, nums: List[int], target: int) -> int:\n"
                "        # TODO: Maintain left and right pointers\n"
                "        # In while left <= right, check mid value\n"
                "        return -1\n"
            )
        },
        "solution_code": {
            "cpp": (
                "#include <vector>\n\n"
                "class Solution {\n"
                "public:\n"
                "    int search(std::vector<int>& nums, int target) {\n"
                "        int left = 0;\n"
                "        int right = static_cast<int>(nums.size()) - 1;\n"
                "        while (left <= right) {\n"
                "            int mid = left + (right - left) / 2;\n"
                "            if (nums[mid] == target) {\n"
                "                return mid;\n"
                "            } else if (nums[mid] < target) {\n"
                "                left = mid + 1;\n"
                "            } else {\n"
                "                right = mid - 1;\n"
                "            }\n"
                "        }\n"
                "        return -1;\n"
                "    }\n"
                "};\n"
            ),
            "python": (
                "from typing import List\n\n"
                "class Solution:\n"
                "    def search(self, nums: List[int], target: int) -> int:\n"
                "        left, right = 0, len(nums) - 1\n"
                "        while left <= right:\n"
                "            mid = (left + right) // 2\n"
                "            if nums[mid] == target:\n"
                "                return mid\n"
                "            elif nums[mid] < target:\n"
                "                left = mid + 1\n"
                "            else:\n"
                "                right = mid - 1\n"
                "        return -1\n"
            )
        },
        "structured_explanation": {
            "problem_understanding": (
                "Locate the index of `target` in a sorted list. Must achieve logarithmic O(log N) time."
            ),
            "approach": (
                "Divide and Conquer / Interval Halving:\n"
                "Maintain two boundary pointers `left` and `right`. In each step, examine the midpoint:\n"
                "- If `nums[mid] == target`, target is found.\n"
                "- If `nums[mid] < target`, the target must be in the right half: set `left = mid + 1`.\n"
                "- If `nums[mid] > target`, the target must be in the left half: set `right = mid - 1`.\n"
                "Repeat while `left <= right`. If pointers cross, target does not exist."
            ),
            "pseudocode": (
                "left = 0, right = N - 1\n"
                "WHILE left <= right:\n"
                "    mid = left + (right - left) // 2\n"
                "    IF nums[mid] == target: RETURN mid\n"
                "    ELSE IF nums[mid] < target: left = mid + 1\n"
                "    ELSE: right = mid - 1\n"
                "RETURN -1"
            ),
            "line_by_line": {
                "cpp": [
                    "int left = 0, right = nums.size() - 1: Sets initial search bounds.",
                    "while (left <= right): Terminates when search window becomes empty.",
                    "int mid = left + (right - left) / 2: Prevents 32-bit signed integer overflow in C++.",
                    "if (nums[mid] == target) return mid: Immediate match.",
                    "left = mid + 1 / right = mid - 1: Strictly excludes inspected mid from future search."
                ],
                "python": [
                    "left, right = 0, len(nums) - 1: Two pointers for the search interval.",
                    "mid = (left + right) // 2: Floor division calculates middle index.",
                    "left = mid + 1: Discards left half.",
                    "right = mid - 1: Discards right half."
                ]
            },
            "dry_run": [
                {"step": 1, "left": 0, "right": 5, "mid": 2, "nums[mid]": 3, "comparison": "3 < 9 -> left = 3"},
                {"step": 2, "left": 3, "right": 5, "mid": 4, "nums[mid]": 9, "comparison": "9 == 9 -> Found! Return 4"}
            ],
            "complexity": {
                "time": "O(log N) — The search space is divided in half with every iteration.",
                "space": "O(1) — Constant extra space."
            }
        }
    },

    # 6. Reverse Linked List
    {
        "id": "reverse-linked-list",
        "leetcode_num": 206,
        "title": "Reverse Linked List",
        "difficulty": "Easy",
        "topic_id": "linked-lists",
        "official_url": "https://leetcode.com/problems/reverse-linked-list/",
        "summary": "Reverse a singly linked list in-place by redirecting pointers.",
        "description": (
            "Given the `head` of a singly linked list, reverse the list, and return the reversed list."
        ),
        "constraints": [
            "The number of nodes in the list is the range [0, 5000].",
            "-5000 <= Node.val <= 5000"
        ],
        "examples": [
            {
                "input": "head = [1, 2, 3, 4, 5]",
                "output": "[5, 4, 3, 2, 1]",
                "explanation": "Pointers reversed from 1->2->3->4->5 to 5->4->3->2->1."
            },
            {
                "input": "head = [1, 2]",
                "output": "[2, 1]",
                "explanation": "1->2 becomes 2->1."
            },
            {
                "input": "head = []",
                "output": "[]",
                "explanation": "Empty list returns empty list."
            }
        ],
        "starter_code": {
            "cpp": (
                "/**\n"
                " * Definition for singly-linked list.\n"
                " * struct ListNode {\n"
                " *     int val;\n"
                " *     ListNode *next;\n"
                " *     ListNode() : val(0), next(nullptr) {}\n"
                " *     ListNode(int x) : val(x), next(nullptr) {}\n"
                " *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n"
                " * };\n"
                " */\n"
                "class Solution {\n"
                "public:\n"
                "    ListNode* reverseList(ListNode* head) {\n"
                "        // TODO: Use three pointers (prev, curr, nextNode)\n"
                "        // In each step: nextNode = curr->next; curr->next = prev; prev = curr; curr = nextNode;\n"
                "        return nullptr;\n"
                "    }\n"
                "};\n"
            ),
            "python": (
                "# Definition for singly-linked list.\n"
                "# class ListNode:\n"
                "#     def __init__(self, val=0, next=None):\n"
                "#         self.val = val\n"
                "#         self.next = next\n"
                "from typing import Optional\n\n"
                "class Solution:\n"
                "    def reverseList(self, head: Optional['ListNode']) -> Optional['ListNode']:\n"
                "        # TODO: Maintain prev = None, curr = head\n"
                "        # Reverse pointers in a while loop\n"
                "        return None\n"
            )
        },
        "solution_code": {
            "cpp": (
                "class Solution {\n"
                "public:\n"
                "    ListNode* reverseList(ListNode* head) {\n"
                "        ListNode* prev = nullptr;\n"
                "        ListNode* curr = head;\n"
                "        while (curr != nullptr) {\n"
                "            ListNode* nextNode = curr->next;\n"
                "            curr->next = prev;\n"
                "            prev = curr;\n"
                "            curr = nextNode;\n"
                "        }\n"
                "        return prev;\n"
                "    }\n"
                "};\n"
            ),
            "python": (
                "class Solution:\n"
                "    def reverseList(self, head: Optional['ListNode']) -> Optional['ListNode']:\n"
                "        prev = None\n"
                "        curr = head\n"
                "        while curr:\n"
                "            next_node = curr.next\n"
                "            curr.next = prev\n"
                "            prev = curr\n"
                "            curr = next_node\n"
                "        return prev\n"
            )
        },
        "structured_explanation": {
            "problem_understanding": (
                "Given pointer to head of a linked list, flip every next pointer so the tail becomes head."
            ),
            "approach": (
                "Three-Pointer In-Place Iteration:\n"
                "1. `prev` starts at nullptr / None.\n"
                "2. `curr` starts at head.\n"
                "3. In each step, save `nextNode = curr.next` so we don't lose the remaining list.\n"
                "4. Flip the pointer: `curr.next = prev`.\n"
                "5. Advance: `prev = curr`, `curr = nextNode`.\n"
                "When `curr` becomes null, `prev` points to the new head."
            ),
            "pseudocode": (
                "prev = NULL\n"
                "curr = head\n"
                "WHILE curr is not NULL:\n"
                "    next_node = curr.next\n"
                "    curr.next = prev\n"
                "    prev = curr\n"
                "    curr = next_node\n"
                "RETURN prev"
            ),
            "line_by_line": {
                "cpp": [
                    "ListNode* prev = nullptr: The original head will point to nullptr as the new tail.",
                    "ListNode* nextNode = curr->next: Crucial temporary variable holding the rest of the list.",
                    "curr->next = prev: Reverses arrow direction.",
                    "prev = curr / curr = nextNode: Slides the two-pointer window one step forward."
                ],
                "python": [
                    "prev = None: New end of list.",
                    "next_node = curr.next: Saves reference to unvisited nodes.",
                    "curr.next = prev: Redirects pointer backwards.",
                    "return prev: When curr is None, prev is the new head."
                ]
            },
            "dry_run": [
                {"step": 1, "curr": 1, "curr.next": "None", "prev": 1, "curr_next": 2},
                {"step": 2, "curr": 2, "curr.next": 1, "prev": 2, "curr_next": 3},
                {"step": 3, "curr": 3, "curr.next": 2, "prev": 3, "curr_next": "None"},
                {"finish": "curr is None, return prev (3)"}
            ],
            "complexity": {
                "time": "O(N) — Visits each of the N nodes exactly once.",
                "space": "O(1) — Constant memory in-place pointer swapping."
            }
        }
    },

    # 7. Invert Binary Tree
    {
        "id": "invert-binary-tree",
        "leetcode_num": 226,
        "title": "Invert Binary Tree",
        "difficulty": "Easy",
        "topic_id": "trees",
        "official_url": "https://leetcode.com/problems/invert-binary-tree/",
        "summary": "Invert a binary tree so every left child becomes right child and vice versa.",
        "description": (
            "Given the `root` of a binary tree, invert the tree, and return its root."
        ),
        "constraints": [
            "The number of nodes in the tree is in the range [0, 100].",
            "-100 <= Node.val <= 100"
        ],
        "examples": [
            {
                "input": "root = [4, 2, 7, 1, 3, 6, 9]",
                "output": "[4, 7, 2, 9, 6, 3, 1]",
                "explanation": "Every node's left and right children are mirrored."
            },
            {
                "input": "root = [2, 1, 3]",
                "output": "[2, 3, 1]",
                "explanation": "2's children (1, 3) become (3, 1)."
            }
        ],
        "starter_code": {
            "cpp": (
                "/**\n"
                " * Definition for a binary tree node.\n"
                " * struct TreeNode {\n"
                " *     int val;\n"
                " *     TreeNode *left;\n"
                " *     TreeNode *right;\n"
                " *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n"
                " *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n"
                " *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n"
                " * };\n"
                " */\n"
                "class Solution {\n"
                "public:\n"
                "    TreeNode* invertTree(TreeNode* root) {\n"
                "        // TODO: Base case: if root is null, return null\n"
                "        // Recursively invert left and right, then swap\n"
                "        return nullptr;\n"
                "    }\n"
                "};\n"
            ),
            "python": (
                "# Definition for a binary tree node.\n"
                "# class TreeNode:\n"
                "#     def __init__(self, val=0, left=None, right=None):\n"
                "#         self.val = val\n"
                "#         self.left = left\n"
                "#         self.right = right\n"
                "from typing import Optional\n\n"
                "class Solution:\n"
                "    def invertTree(self, root: Optional['TreeNode']) -> Optional['TreeNode']:\n"
                "        # TODO: Base case: if not root: return None\n"
                "        # Swap children and recursively invert\n"
                "        return None\n"
            )
        },
        "solution_code": {
            "cpp": (
                "#include <algorithm>\n\n"
                "class Solution {\n"
                "public:\n"
                "    TreeNode* invertTree(TreeNode* root) {\n"
                "        if (!root) return nullptr;\n"
                "        TreeNode* left = invertTree(root->left);\n"
                "        TreeNode* right = invertTree(root->right);\n"
                "        root->left = right;\n"
                "        root->right = left;\n"
                "        return root;\n"
                "    }\n"
                "};\n"
            ),
            "python": (
                "class Solution:\n"
                "    def invertTree(self, root: Optional['TreeNode']) -> Optional['TreeNode']:\n"
                "        if not root:\n"
                "            return None\n"
                "        root.left, root.right = self.invertTree(root.right), self.invertTree(root.left)\n"
                "        return root\n"
            )
        },
        "structured_explanation": {
            "problem_understanding": (
                "Create a mirror image of the binary tree.\n"
                "For every node, swap its left subtree with its right subtree."
            ),
            "approach": (
                "Recursive Depth-First Search (Post-order):\n"
                "1. Base case: If root is null, return null.\n"
                "2. Recursively invert left subtree.\n"
                "3. Recursively invert right subtree.\n"
                "4. Swap root->left and root->right.\n"
                "5. Return root."
            ),
            "pseudocode": (
                "FUNCTION invert(node):\n"
                "    IF node is NULL: RETURN NULL\n"
                "    left_inverted = invert(node.left)\n"
                "    right_inverted = invert(node.right)\n"
                "    node.left = right_inverted\n"
                "    node.right = left_inverted\n"
                "    RETURN node"
            ),
            "line_by_line": {
                "cpp": [
                    "if (!root) return nullptr: Base case prevents dereferencing null pointers.",
                    "TreeNode* left = invertTree(root->left): Recursively computes inverted left branch.",
                    "root->left = right; root->right = left: Assigns mirrored branches to current node."
                ],
                "python": [
                    "if not root: return None: Pythonic base check for empty tree or leaf child.",
                    "root.left, root.right = invert(root.right), invert(root.left): Simultaneous tuple assignment swaps subtrees cleanly."
                ]
            },
            "dry_run": [
                {"step": "Root 2", "left child": 1, "right child": 3},
                {"step": "Invert leaves", "invert(1)": 1, "invert(3)": 3},
                {"step": "Swap at root 2", "2.left": 3, "2.right": 1, "result": "[2, 3, 1]"}
            ],
            "complexity": {
                "time": "O(N) — Must touch every node once.",
                "space": "O(H) — Recursion stack depth equals tree height H (O(log N) balanced, O(N) worst case)."
            }
        }
    },

    # 8. Climbing Stairs
    {
        "id": "climbing-stairs",
        "leetcode_num": 70,
        "title": "Climbing Stairs",
        "difficulty": "Easy",
        "topic_id": "dynamic-programming",
        "official_url": "https://leetcode.com/problems/climbing-stairs/",
        "summary": "Calculate the number of distinct ways to climb n stairs taking 1 or 2 steps.",
        "description": (
            "You are climbing a staircase. It takes `n` steps to reach the top.\n\n"
            "Each time you can either climb `1` or `2` steps. In how many distinct ways can you climb to the top?"
        ),
        "constraints": [
            "1 <= n <= 45"
        ],
        "examples": [
            {
                "input": "n = 2",
                "output": "2",
                "explanation": "Two ways: 1 step + 1 step, or 2 steps."
            },
            {
                "input": "n = 3",
                "output": "3",
                "explanation": "Three ways: (1+1+1), (1+2), (2+1)."
            }
        ],
        "starter_code": {
            "cpp": (
                "class Solution {\n"
                "public:\n"
                "    int climbStairs(int n) {\n"
                "        // TODO: Notice ways(n) = ways(n-1) + ways(n-2)\n"
                "        // Use two variables to store previous steps\n"
                "        return 0;\n"
                "    }\n"
                "};\n"
            ),
            "python": (
                "class Solution:\n"
                "    def climbStairs(self, n: int) -> int:\n"
                "        # TODO: Fibonacci relation: dp[i] = dp[i-1] + dp[i-2]\n"
                "        return 0\n"
            )
        },
        "solution_code": {
            "cpp": (
                "class Solution {\n"
                "public:\n"
                "    int climbStairs(int n) {\n"
                "        if (n <= 2) return n;\n"
                "        int prev2 = 1, prev1 = 2;\n"
                "        for (int i = 3; i <= n; ++i) {\n"
                "            int curr = prev1 + prev2;\n"
                "            prev2 = prev1;\n"
                "            prev1 = curr;\n"
                "        }\n"
                "        return prev1;\n"
                "    }\n"
                "};\n"
            ),
            "python": (
                "class Solution:\n"
                "    def climbStairs(self, n: int) -> int:\n"
                "        if n <= 2:\n"
                "            return n\n"
                "        prev2, prev1 = 1, 2\n"
                "        for _ in range(3, n + 1):\n"
                "            curr = prev1 + prev2\n"
                "            prev2 = prev1\n"
                "            prev1 = curr\n"
                "        return prev1\n"
            )
        },
        "structured_explanation": {
            "problem_understanding": (
                "To reach step n, our final jump was either 1 step (from n-1) or 2 steps (from n-2).\n"
                "Therefore, total distinct ways to reach n = ways(n-1) + ways(n-2). This is the Fibonacci sequence!"
            ),
            "approach": (
                "1. State: `dp[i]` = number of distinct ways to reach step `i`.\n"
                "2. Base cases: `dp[1] = 1`, `dp[2] = 2`.\n"
                "3. Transition: `dp[i] = dp[i-1] + dp[i-2]`.\n"
                "4. Space Optimization: Since `dp[i]` only depends on the previous two values, we only need 2 variables instead of an entire array."
            ),
            "pseudocode": (
                "IF n <= 2: RETURN n\n"
                "prev2 = 1, prev1 = 2\n"
                "FOR i from 3 to n:\n"
                "    curr = prev1 + prev2\n"
                "    prev2 = prev1\n"
                "    prev1 = curr\n"
                "RETURN prev1"
            ),
            "line_by_line": {
                "cpp": [
                    "if (n <= 2) return n: Handles base steps (1 way for 1 step, 2 ways for 2 steps).",
                    "int prev2 = 1, prev1 = 2: Represents dp[i-2] and dp[i-1].",
                    "int curr = prev1 + prev2: Sum of previous two step possibilities.",
                    "prev2 = prev1; prev1 = curr: Slides state window forward."
                ],
                "python": [
                    "prev2, prev1 = 1, 2: Two state variables replace O(N) array allocation.",
                    "for _ in range(3, n + 1): Computes bottom-up values from step 3 to n.",
                    "return prev1: Final result for step n."
                ]
            },
            "dry_run": [
                {"step": 3, "prev2 (step 1)": 1, "prev1 (step 2)": 2, "curr (step 3)": 3},
                {"step": 4, "prev2 (step 2)": 2, "prev1 (step 3)": 3, "curr (step 4)": 5},
                {"step": 5, "prev2 (step 3)": 3, "prev1 (step 4)": 5, "curr (step 5)": 8}
            ],
            "complexity": {
                "time": "O(N) — Linear loop computing steps 3 through N.",
                "space": "O(1) — Optimized to two integer variables."
            }
        }
    },

    # 9. Number of Islands
    {
        "id": "number-of-islands",
        "leetcode_num": 200,
        "title": "Number of Islands",
        "difficulty": "Medium",
        "topic_id": "graphs",
        "official_url": "https://leetcode.com/problems/number-of-islands/",
        "summary": "Count connected components of land '1's in a 2D grid using DFS or BFS.",
        "description": (
            "Given an `m x n` 2D binary grid `grid` which represents a map of `'1'`s (land) and `'0'`s (water), "
            "return the number of islands.\n\n"
            "An **island** is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. "
            "You may assume all four edges of the grid are all surrounded by water."
        ),
        "constraints": [
            "m == grid.length",
            "n == grid[i].length",
            "1 <= m, n <= 300",
            "`grid[i][j]` is `'0'` or `'1'`."
        ],
        "examples": [
            {
                "input": "grid = [[\"1\",\"1\",\"0\"],[\"1\",\"1\",\"0\"],[\"0\",\"0\",\"1\"]]",
                "output": "2",
                "explanation": "One large 2x2 island in top-left, and one single-cell island in bottom-right."
            }
        ],
        "starter_code": {
            "cpp": (
                "#include <vector>\n\n"
                "class Solution {\n"
                "public:\n"
                "    int numIslands(std::vector<std::vector<char>>& grid) {\n"
                "        // TODO: Loop over all cells; when '1' is found, increment island_count\n"
                "        // Run DFS/BFS to sink all connected land cells by setting them to '0'\n"
                "        return 0;\n"
                "    }\n"
                "};\n"
            ),
            "python": (
                "from typing import List\n\n"
                "class Solution:\n"
                "    def numIslands(self, grid: List[List[str]]) -> int:\n"
                "        # TODO: Iterate over grid, when cell == '1':\n"
                "        # Increment count and trigger DFS/BFS to mark visited connected cells\n"
                "        return 0\n"
            )
        },
        "solution_code": {
            "cpp": (
                "#include <vector>\n\n"
                "class Solution {\n"
                "public:\n"
                "    int numIslands(std::vector<std::vector<char>>& grid) {\n"
                "        if (grid.empty()) return 0;\n"
                "        int m = grid.size(), n = grid[0].size();\n"
                "        int count = 0;\n"
                "        for (int r = 0; r < m; ++r) {\n"
                "            for (int c = 0; c < n; ++c) {\n"
                "                if (grid[r][c] == '1') {\n"
                "                    count++;\n"
                "                    dfs(grid, r, c, m, n);\n"
                "                }\n"
                "            }\n"
                "        }\n"
                "        return count;\n"
                "    }\n"
                "private:\n"
                "    void dfs(std::vector<std::vector<char>>& grid, int r, int c, int m, int n) {\n"
                "        if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] != '1') return;\n"
                "        grid[r][c] = '0'; // Sink cell\n"
                "        dfs(grid, r + 1, c, m, n);\n"
                "        dfs(grid, r - 1, c, m, n);\n"
                "        dfs(grid, r, c + 1, m, n);\n"
                "        dfs(grid, r, c - 1, m, n);\n"
                "    }\n"
                "};\n"
            ),
            "python": (
                "from typing import List\n\n"
                "class Solution:\n"
                "    def numIslands(self, grid: List[List[str]]) -> int:\n"
                "        if not grid: return 0\n"
                "        m, n = len(grid), len(grid[0])\n"
                "        count = 0\n"
                "        def dfs(r, c):\n"
                "            if r < 0 or r >= m or c < 0 or c >= n or grid[r][c] != '1':\n"
                "                return\n"
                "            grid[r][c] = '0'\n"
                "            dfs(r + 1, c)\n"
                "            dfs(r - 1, c)\n"
                "            dfs(r, c + 1)\n"
                "            dfs(r, c - 1)\n"
                "        for r in range(m):\n"
                "            for c in range(n):\n"
                "                if grid[r][c] == '1':\n"
                "                    count += 1\n"
                "                    dfs(r, c)\n"
                "        return count\n"
            )
        },
        "structured_explanation": {
            "problem_understanding": (
                "Count the number of disconnected components in an undirected 2D grid graph.\n"
                "Two '1's belong to the same island if they are adjacent horizontally or vertically (4-directional)."
            ),
            "approach": (
                "Connected Components via Grid DFS (Flood Fill / Sinking):\n"
                "Scan the grid row by row, column by column.\n"
                "When an unvisited land cell `'1'` is encountered:\n"
                "1. Increment our island counter.\n"
                "2. Trigger DFS from `(r, c)` to explore all 4 neighbors.\n"
                "3. In DFS, mark visited cells by overwriting `'1'` with `'0'` ('sinking the island') to avoid revisiting."
            ),
            "pseudocode": (
                "count = 0\n"
                "FOR r from 0 to m-1:\n"
                "    FOR c from 0 to n-1:\n"
                "        IF grid[r][c] == '1':\n"
                "            count++\n"
                "            dfs(r, c) // marks all 4-directional connected '1's as '0'\n"
                "RETURN count"
            ),
            "line_by_line": {
                "cpp": [
                    "if (grid[r][c] == '1'): Discovers a new unvisited connected component.",
                    "grid[r][c] = '0': Sinks the current land cell in-place to prevent infinite loops.",
                    "dfs in 4 directions: Checks down (r+1), up (r-1), right (c+1), left (c-1)."
                ],
                "python": [
                    "def dfs(r, c): Inner function accesses grid bounds m and n directly.",
                    "if r < 0 or r >= m or c < 0 or c >= n: Bounds check avoids IndexError.",
                    "grid[r][c] = '0': Mutates matrix in-place."
                ]
            },
            "dry_run": [
                {"step": "Scan at (0,0)", "value": "'1'", "action": "count=1, sink (0,0), (0,1), (1,0), (1,1)"},
                {"step": "Scan at (2,2)", "value": "'1'", "action": "count=2, sink (2,2)"},
                {"step": "Finished", "total_islands": 2}
            ],
            "complexity": {
                "time": "O(M * N) — Every cell is visited at most once.",
                "space": "O(M * N) — In worst case (entire grid is land), recursion stack depth reaches M * N."
            }
        }
    },

    # 10. Implement Queue using Stacks
    {
        "id": "implement-queue-using-stacks",
        "leetcode_num": 232,
        "title": "Implement Queue using Stacks",
        "difficulty": "Easy",
        "topic_id": "queues",
        "official_url": "https://leetcode.com/problems/implement-queue-using-stacks/",
        "summary": "Implement FIFO queue operations using two LIFO stacks.",
        "description": (
            "Implement a first in first out (FIFO) queue using only two stacks.\n"
            "The implemented queue should support all the functions of a normal queue (`push`, `peek`, `pop`, and `empty`)."
        ),
        "constraints": [
            "1 <= x <= 9",
            "At most 100 calls will be made to `push`, `pop`, `peek`, and `empty`.",
            "All the calls to `pop` and `peek` are valid."
        ],
        "examples": [
            {
                "input": "push(1), push(2), peek(), pop(), empty()",
                "output": "[null, null, 1, 1, false]",
                "explanation": "Queue behaves FIFO: 1 was pushed first, so peek() returns 1 and pop() removes 1."
            }
        ],
        "starter_code": {
            "cpp": (
                "#include <stack>\n\n"
                "class MyQueue {\n"
                "public:\n"
                "    MyQueue() {}\n"
                "    void push(int x) {}\n"
                "    int pop() { return 0; }\n"
                "    int peek() { return 0; }\n"
                "    bool empty() { return true; }\n"
                "};\n"
            ),
            "python": (
                "class MyQueue:\n"
                "    def __init__(self):\n"
                "        self.in_stack = []\n"
                "        self.out_stack = []\n\n"
                "    def push(self, x: int) -> None:\n"
                "        pass\n\n"
                "    def pop(self) -> int:\n"
                "        return 0\n\n"
                "    def peek(self) -> int:\n"
                "        return 0\n\n"
                "    def empty(self) -> bool:\n"
                "        return True\n"
            )
        },
        "solution_code": {
            "cpp": (
                "#include <stack>\n\n"
                "class MyQueue {\n"
                "private:\n"
                "    std::stack<int> in_st, out_st;\n"
                "    void transfer() {\n"
                "        if (out_st.empty()) {\n"
                "            while (!in_st.empty()) {\n"
                "                out_st.push(in_st.top());\n"
                "                in_st.pop();\n"
                "            }\n"
                "        }\n"
                "    }\n"
                "public:\n"
                "    MyQueue() {}\n"
                "    void push(int x) { in_st.push(x); }\n"
                "    int pop() {\n"
                "        transfer();\n"
                "        int val = out_st.top();\n"
                "        out_st.pop();\n"
                "        return val;\n"
                "    }\n"
                "    int peek() {\n"
                "        transfer();\n"
                "        return out_st.top();\n"
                "    }\n"
                "    bool empty() { return in_st.empty() && out_st.empty(); }\n"
                "};\n"
            ),
            "python": (
                "class MyQueue:\n"
                "    def __init__(self):\n"
                "        self.in_st = []\n"
                "        self.out_st = []\n\n"
                "    def push(self, x: int) -> None:\n"
                "        self.in_st.append(x)\n\n"
                "    def _transfer(self):\n"
                "        if not self.out_st:\n"
                "            while self.in_st:\n"
                "                self.out_st.append(self.in_st.pop())\n\n"
                "    def pop(self) -> int:\n"
                "        self._transfer()\n"
                "        return self.out_st.pop()\n\n"
                "    def peek(self) -> int:\n"
                "        self._transfer()\n"
                "        return self.out_st[-1]\n\n"
                "    def empty(self) -> bool:\n"
                "        return not self.in_st and not self.out_st\n"
            )
        },
        "structured_explanation": {
            "problem_understanding": (
                "Convert two LIFO stacks into a FIFO queue.\n"
                "Push adds to the back of the queue; pop removes from the front."
            ),
            "approach": (
                "Two-Stack Lazy Transfer:\n"
                "1. `in_st`: Holds newly pushed elements.\n"
                "2. `out_st`: Holds elements ready to be popped/peeked in FIFO order.\n"
                "When `pop` or `peek` is requested, if `out_st` is empty, pour all elements from `in_st` to `out_st`.\n"
                "Pouring inverts the order, turning LIFO into FIFO! Each element is moved at most twice, yielding O(1) amortized time."
            ),
            "pseudocode": (
                "FUNCTION push(x): in_st.push(x)\n"
                "FUNCTION pop():\n"
                "    transfer()\n"
                "    RETURN out_st.pop()\n"
                "FUNCTION transfer():\n"
                "    IF out_st is empty:\n"
                "        WHILE in_st is not empty:\n"
                "            out_st.push(in_st.pop())"
            ),
            "line_by_line": {
                "cpp": [
                    "in_st.push(x): O(1) push onto input stack.",
                    "transfer(): Only dumps when out_st is empty to preserve FIFO order.",
                    "return in_st.empty() && out_st.empty(): Queue is empty only when both stacks are dry."
                ],
                "python": [
                    "self.in_st.append(x): Pushes onto active ingestion list.",
                    "self.out_st.append(self.in_st.pop()): Inverts order on demand."
                ]
            },
            "dry_run": [
                {"step": "push(1), push(2)", "in_st": "[1, 2]", "out_st": "[]"},
                {"step": "pop() triggers transfer", "in_st": "[]", "out_st": "[2, 1]"},
                {"step": "pop from out_st", "returns": 1, "remaining out_st": "[2]"}
            ],
            "complexity": {
                "time": "O(1) amortized for pop/peek; O(1) worst-case for push and empty.",
                "space": "O(N) to store N elements."
            }
        }
    },
    # 11. Container With Most Water
    {
        "id": "container-with-most-water",
        "leetcode_num": 11,
        "title": "Container With Most Water",
        "difficulty": "Medium",
        "topic_id": "two-pointers-sliding-window",
        "official_url": "https://leetcode.com/problems/container-with-most-water/",
        "summary": "Find two lines that together with the x-axis form a container holding the most water.",
        "description": (
            "You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the ith line are `(i, 0)` and `(i, height[i])`.\n\n"
            "Find two lines that together with the x-axis form a container, such that the container contains the most water.\n\n"
            "Return the maximum amount of water a container can store."
        ),
        "constraints": [
            "n == height.length",
            "2 <= n <= 10^5",
            "0 <= height[i] <= 10^4"
        ],
        "examples": [
            {
                "input": "height = [1, 8, 6, 2, 5, 4, 8, 3, 7]",
                "output": "49",
                "explanation": "The maximum area is between index 1 (height 8) and index 8 (height 7): min(8, 7) * (8 - 1) = 49."
            },
            {
                "input": "height = [1, 1]",
                "output": "1",
                "explanation": "min(1, 1) * (1 - 0) = 1."
            }
        ],
        "starter_code": {
            "cpp": (
                "#include <vector>\n"
                "#include <algorithm>\n\n"
                "class Solution {\n"
                "public:\n"
                "    int maxArea(std::vector<int>& height) {\n"
                "        // TODO: Two pointers at left and right boundaries\n"
                "        return 0;\n"
                "    }\n"
                "};\n"
            ),
            "python": (
                "class Solution:\n"
                "    def maxArea(self, height: list[int]) -> int:\n"
                "        # TODO: Two pointers at left and right boundaries\n"
                "        return 0\n"
            )
        },
        "solution_code": {
            "cpp": (
                "#include <vector>\n"
                "#include <algorithm>\n\n"
                "class Solution {\n"
                "public:\n"
                "    int maxArea(std::vector<int>& height) {\n"
                "        int left = 0;\n"
                "        int right = (int)height.size() - 1;\n"
                "        int max_water = 0;\n"
                "        while (left < right) {\n"
                "            int h = std::min(height[left], height[right]);\n"
                "            int area = h * (right - left);\n"
                "            if (area > max_water) max_water = area;\n"
                "            if (height[left] < height[right]) {\n"
                "                left++;\n"
                "            } else {\n"
                "                right--;\n"
                "            }\n"
                "        }\n"
                "        return max_water;\n"
                "    }\n"
                "};\n"
            ),
            "python": (
                "class Solution:\n"
                "    def maxArea(self, height: list[int]) -> int:\n"
                "        left, right = 0, len(height) - 1\n"
                "        max_water = 0\n"
                "        while left < right:\n"
                "            h = min(height[left], height[right])\n"
                "            area = h * (right - left)\n"
                "            if area > max_water:\n"
                "                max_water = area\n"
                "            if height[left] < height[right]:\n"
                "                left += 1\n"
                "            else:\n"
                "                right -= 1\n"
                "        return max_water\n"
            )
        },
        "test_cases": [
            {"input": "height = [1, 8, 6, 2, 5, 4, 8, 3, 7]", "expected_output": "49", "is_hidden": False},
            {"input": "height = [1, 1]", "expected_output": "1", "is_hidden": False},
            {"input": "height = [4, 3, 2, 1, 4]", "expected_output": "16", "is_hidden": True}
        ],
        "structured_explanation": {
            "problem_understanding": "We want to maximize container area = width * min(height[left], height[right]). Moving the taller pointer inward cannot increase height and always decreases width, so we greedily move the shorter pointer inward.",
            "approach": "Two-pointers starting at indices 0 and N-1. Calculate current area, update max, and advance the pointer pointing to the shorter vertical line.",
            "pseudocode": "1. left = 0, right = n - 1, max_water = 0\n2. while left < right:\n    area = min(height[left], height[right]) * (right - left)\n    max_water = max(max_water, area)\n    if height[left] < height[right]: left++\n    else: right--\n3. return max_water",
            "line_by_line": {
                "cpp": [
                    "int left = 0, right = height.size() - 1: Positions at outer edges.",
                    "int h = std::min(height[left], height[right]): Bottleneck height.",
                    "if (height[left] < height[right]) left++: Advance shorter line inward."
                ],
                "python": [
                    "left, right = 0, len(height) - 1: Positions at outer edges.",
                    "h = min(height[left], height[right]): Bottleneck height.",
                    "if height[left] < height[right]: left += 1: Advance shorter line inward."
                ]
            },
            "dry_run": [
                {"step": "left=0 (h=1), right=8 (h=7)", "area": "1 * 8 = 8", "action": "left++"},
                {"step": "left=1 (h=8), right=8 (h=7)", "area": "7 * 7 = 49", "action": "right--"},
                {"step": "left=1 (h=8), right=7 (h=3)", "area": "3 * 6 = 18", "action": "right--"}
            ],
            "complexity": {
                "time": "O(N) single pass traversing from both ends.",
                "space": "O(1) constant auxiliary space."
            }
        }
    },
    # 12. Kth Largest Element in an Array
    {
        "id": "kth-largest-element-in-an-array",
        "leetcode_num": 215,
        "title": "Kth Largest Element in an Array",
        "difficulty": "Medium",
        "topic_id": "heaps",
        "official_url": "https://leetcode.com/problems/kth-largest-element-in-an-array/",
        "summary": "Find the kth largest element in an unsorted array using a min-heap or QuickSelect.",
        "description": (
            "Given an integer array `nums` and an integer `k`, return the `k`th largest element in the array.\n\n"
            "Note that it is the `k`th largest element in the sorted order, not the `k`th distinct element.\n\n"
            "Can you solve it without sorting the entire array?"
        ),
        "constraints": [
            "1 <= k <= nums.length <= 10^5",
            "-10^4 <= nums[i] <= 10^4"
        ],
        "examples": [
            {
                "input": "nums = [3, 2, 1, 5, 6, 4], k = 2",
                "output": "5",
                "explanation": "Sorted descending: [6, 5, 4, 3, 2, 1]. The 2nd largest element is 5."
            },
            {
                "input": "nums = [3, 2, 3, 1, 2, 4, 5, 5, 6], k = 4",
                "output": "4",
                "explanation": "Sorted descending: [6, 5, 5, 4, 3, 3, 2, 2, 1]. The 4th largest element is 4."
            }
        ],
        "starter_code": {
            "cpp": (
                "#include <vector>\n"
                "#include <queue>\n\n"
                "class Solution {\n"
                "public:\n"
                "    int findKthLargest(std::vector<int>& nums, int k) {\n"
                "        // TODO: Maintain a min-heap of size k\n"
                "        return 0;\n"
                "    }\n"
                "};\n"
            ),
            "python": (
                "import heapq\n\n"
                "class Solution:\n"
                "    def findKthLargest(self, nums: list[int], k: int) -> int:\n"
                "        # TODO: Maintain a min-heap of size k\n"
                "        return 0\n"
            )
        },
        "solution_code": {
            "cpp": (
                "#include <vector>\n"
                "#include <queue>\n\n"
                "class Solution {\n"
                "public:\n"
                "    int findKthLargest(std::vector<int>& nums, int k) {\n"
                "        std::priority_queue<int, std::vector<int>, std::greater<int>> min_heap;\n"
                "        for (int num : nums) {\n"
                "            min_heap.push(num);\n"
                "            if (min_heap.size() > (size_t)k) {\n"
                "                min_heap.pop();\n"
                "            }\n"
                "        }\n"
                "        return min_heap.top();\n"
                "    }\n"
                "};\n"
            ),
            "python": (
                "import heapq\n\n"
                "class Solution:\n"
                "    def findKthLargest(self, nums: list[int], k: int) -> int:\n"
                "        min_heap = []\n"
                "        for num in nums:\n"
                "            heapq.heappush(min_heap, num)\n"
                "            if len(min_heap) > k:\n"
                "                heapq.heappop(min_heap)\n"
                "        return min_heap[0]\n"
            )
        },
        "test_cases": [
            {"input": "nums = [3, 2, 1, 5, 6, 4], k = 2", "expected_output": "5", "is_hidden": False},
            {"input": "nums = [3, 2, 3, 1, 2, 4, 5, 5, 6], k = 4", "expected_output": "4", "is_hidden": False},
            {"input": "nums = [1], k = 1", "expected_output": "1", "is_hidden": True}
        ],
        "structured_explanation": {
            "problem_understanding": "Instead of sorting the entire array in O(N log N), a min-heap of size k retains only the top k largest elements. The root of the min-heap holds the kth largest element.",
            "approach": "Iterate through each number in nums, pushing it into the min-heap. Whenever the heap size exceeds k, pop the smallest element. After inspecting all elements, return the top.",
            "pseudocode": "1. Initialize empty min_heap\n2. For each num in nums:\n    Push num into min_heap\n    If size(min_heap) > k: Pop root\n3. Return min_heap.top()",
            "line_by_line": {
                "cpp": [
                    "std::priority_queue<int, std::vector<int>, std::greater<int>>: Instantiates a min-heap.",
                    "min_heap.push(num): Adds candidate element in O(log k).",
                    "if (min_heap.size() > k) min_heap.pop(): Discards elements smaller than the top-k."
                ],
                "python": [
                    "heapq.heappush(min_heap, num): Pushes element maintaining min-heap invariant.",
                    "heapq.heappop(min_heap): Discards smallest when size exceeds k.",
                    "return min_heap[0]: Root element is the kth largest."
                ]
            },
            "dry_run": [
                {"input": "3, 2, 1, 5, 6, 4 (k=2)", "heap_state": "[3, 2] -> pops 2 -> [3]"},
                {"element": "5, 6, 4", "final_heap": "[5, 6] (size 2)"},
                {"top": "5", "verdict": "2nd largest is 5"}
            ],
            "complexity": {
                "time": "O(N log k) to process N elements with a heap of size k.",
                "space": "O(k) auxiliary memory for the heap."
            }
        }
    },
    # 13. Subsets
    {
        "id": "subsets",
        "leetcode_num": 78,
        "title": "Subsets",
        "difficulty": "Medium",
        "topic_id": "recursion-backtracking",
        "official_url": "https://leetcode.com/problems/subsets/",
        "summary": "Return all possible subsets (the power set) of unique numbers using backtracking.",
        "description": (
            "Given an integer array `nums` of unique elements, return all possible subsets (the power set).\n\n"
            "The solution set must not contain duplicate subsets. Return the solution in any order."
        ),
        "constraints": [
            "1 <= nums.length <= 10",
            "-10 <= nums[i] <= 10",
            "All elements of nums are unique."
        ],
        "examples": [
            {
                "input": "nums = [1, 2, 3]",
                "output": "[[], [1], [2], [1, 2], [3], [1, 3], [2, 3], [1, 2, 3]]",
                "explanation": "All 2^3 = 8 combinatorial subsets."
            },
            {
                "input": "nums = [0]",
                "output": "[[], [0]]",
                "explanation": "All 2^1 = 2 subsets."
            }
        ],
        "starter_code": {
            "cpp": (
                "#include <vector>\n\n"
                "class Solution {\n"
                "public:\n"
                "    std::vector<std::vector<int>> subsets(std::vector<int>& nums) {\n"
                "        // TODO: Backtrack to explore include / exclude decisions\n"
                "        return {};\n"
                "    }\n"
                "};\n"
            ),
            "python": (
                "class Solution:\n"
                "    def subsets(self, nums: list[int]) -> list[list[int]]:\n"
                "        # TODO: Backtrack to explore include / exclude decisions\n"
                "        return []\n"
            )
        },
        "solution_code": {
            "cpp": (
                "#include <vector>\n\n"
                "class Solution {\n"
                "private:\n"
                "    void backtrack(int start, const std::vector<int>& nums, std::vector<int>& current, std::vector<std::vector<int>>& result) {\n"
                "        result.push_back(current);\n"
                "        for (size_t i = start; i < nums.size(); ++i) {\n"
                "            current.push_back(nums[i]);\n"
                "            backtrack(i + 1, nums, current, result);\n"
                "            current.pop_back();\n"
                "        }\n"
                "    }\n"
                "public:\n"
                "    std::vector<std::vector<int>> subsets(std::vector<int>& nums) {\n"
                "        std::vector<std::vector<int>> result;\n"
                "        std::vector<int> current;\n"
                "        backtrack(0, nums, current, result);\n"
                "        return result;\n"
                "    }\n"
                "};\n"
            ),
            "python": (
                "class Solution:\n"
                "    def subsets(self, nums: list[int]) -> list[list[int]]:\n"
                "        result = []\n"
                "        def backtrack(start, current):\n"
                "            result.append(list(current))\n"
                "            for i in range(start, len(nums)):\n"
                "                current.append(nums[i])\n"
                "                backtrack(i + 1, current)\n"
                "                current.pop()\n"
                "        backtrack(0, [])\n"
                "        return result\n"
            )
        },
        "test_cases": [
            {"input": "nums = [1, 2, 3]", "expected_output": "[[], [1], [2], [1, 2], [3], [1, 3], [2, 3], [1, 2, 3]]", "is_hidden": False},
            {"input": "nums = [0]", "expected_output": "[[], [0]]", "is_hidden": False},
            {"input": "nums = [4, 5]", "expected_output": "[[], [4], [5], [4, 5]]", "is_hidden": True}
        ],
        "structured_explanation": {
            "problem_understanding": "Every element in nums has two choices: either be included in the subset or be excluded. For N elements, there are exactly 2^N unique subsets.",
            "approach": "Depth-First Search (DFS) backtracking: at each recursive call, snapshot the current subset into results, iterate from start index, append candidate, recurse to i+1, and pop (backtrack).",
            "pseudocode": "1. result = []\n2. backtrack(start, current):\n    result.append(copy(current))\n    for i in range(start, len(nums)):\n        current.append(nums[i])\n        backtrack(i + 1, current)\n        current.pop()",
            "line_by_line": {
                "cpp": [
                    "result.push_back(current): Snapshots state at each node of recursion tree.",
                    "current.push_back(nums[i]): Choose branch.",
                    "current.pop_back(): Unchoose branch to backtrack."
                ],
                "python": [
                    "result.append(list(current)): Appends copy of current candidate.",
                    "current.append(nums[i]): Explore branch.",
                    "current.pop(): Backtrack state."
                ]
            },
            "dry_run": [
                {"call": "backtrack(0, [])", "adds": "[]"},
                {"call": "backtrack(1, [1])", "adds": "[1]"},
                {"call": "backtrack(2, [1, 2])", "adds": "[1, 2]"}
            ],
            "complexity": {
                "time": "O(N * 2^N) to generate all 2^N subsets and copy each.",
                "space": "O(N) recursion stack and candidate list."
            }
        }
    },
    # 14. Jump Game
    {
        "id": "jump-game",
        "leetcode_num": 55,
        "title": "Jump Game",
        "difficulty": "Medium",
        "topic_id": "greedy",
        "official_url": "https://leetcode.com/problems/jump-game/",
        "summary": "Determine if you can reach the last index from the first index using a greedy max-reach tracker.",
        "description": (
            "You are given an integer array `nums`. You are initially positioned at the array's first index, and each element in the array represents your maximum jump length at that position.\n\n"
            "Return `true` if you can reach the last index, or `false` otherwise."
        ),
        "constraints": [
            "1 <= nums.length <= 10^4",
            "0 <= nums[i] <= 10^5"
        ],
        "examples": [
            {
                "input": "nums = [2, 3, 1, 1, 4]",
                "output": "true",
                "explanation": "Jump 1 step from index 0 to 1, then 3 steps to the last index."
            },
            {
                "input": "nums = [3, 2, 1, 0, 4]",
                "output": "false",
                "explanation": "You will always arrive at index 3 no matter what. Its maximum jump length is 0, which makes it impossible to reach the last index."
            }
        ],
        "starter_code": {
            "cpp": (
                "#include <vector>\n"
                "#include <algorithm>\n\n"
                "class Solution {\n"
                "public:\n"
                "    bool canJump(std::vector<int>& nums) {\n"
                "        // TODO: Greedily track max reachable index\n"
                "        return false;\n"
                "    }\n"
                "};\n"
            ),
            "python": (
                "class Solution:\n"
                "    def canJump(self, nums: list[int]) -> bool:\n"
                "        # TODO: Greedily track max reachable index\n"
                "        return False\n"
            )
        },
        "solution_code": {
            "cpp": (
                "#include <vector>\n"
                "#include <algorithm>\n\n"
                "class Solution {\n"
                "public:\n"
                "    bool canJump(std::vector<int>& nums) {\n"
                "        int max_reach = 0;\n"
                "        int n = nums.size();\n"
                "        for (int i = 0; i < n; ++i) {\n"
                "            if (i > max_reach) return false;\n"
                "            max_reach = std::max(max_reach, i + nums[i]);\n"
                "            if (max_reach >= n - 1) return true;\n"
                "        }\n"
                "        return true;\n"
                "    }\n"
                "};\n"
            ),
            "python": (
                "class Solution:\n"
                "    def canJump(self, nums: list[int]) -> bool:\n"
                "        max_reach = 0\n"
                "        n = len(nums)\n"
                "        for i, jump in enumerate(nums):\n"
                "            if i > max_reach:\n"
                "                return False\n"
                "            max_reach = max(max_reach, i + jump)\n"
                "            if max_reach >= n - 1:\n"
                "                return True\n"
                "        return True\n"
            )
        },
        "test_cases": [
            {"input": "nums = [2, 3, 1, 1, 4]", "expected_output": "true", "is_hidden": False},
            {"input": "nums = [3, 2, 1, 0, 4]", "expected_output": "false", "is_hidden": False},
            {"input": "nums = [0]", "expected_output": "true", "is_hidden": True}
        ],
        "structured_explanation": {
            "problem_understanding": "At index i, we can jump anywhere up to i + nums[i]. We only need to know if the furthest reachable index can reach or surpass the final index.",
            "approach": "Maintain max_reach variable initialized to 0. As we iterate through index i, if i > max_reach, we are stuck and cannot proceed. Otherwise update max_reach = max(max_reach, i + nums[i]).",
            "pseudocode": "1. max_reach = 0\n2. For i from 0 to n-1:\n    If i > max_reach: return False\n    max_reach = max(max_reach, i + nums[i])\n    If max_reach >= n - 1: return True\n3. Return True",
            "line_by_line": {
                "cpp": [
                    "if (i > max_reach) return false: Current index is unreachable.",
                    "max_reach = std::max(max_reach, i + nums[i]): Greedily extends boundary.",
                    "if (max_reach >= n - 1) return true: Early exit once target reached."
                ],
                "python": [
                    "if i > max_reach: return False: Cannot cross past current boundary.",
                    "max_reach = max(max_reach, i + jump): Updates horizon.",
                    "if max_reach >= n - 1: return True: Early termination."
                ]
            },
            "dry_run": [
                {"i": 0, "val": 2, "max_reach": "0 + 2 = 2"},
                {"i": 1, "val": 3, "max_reach": "max(2, 1 + 3) = 4 >= 4", "verdict": "returns True"}
            ],
            "complexity": {
                "time": "O(N) single pass through the array.",
                "space": "O(1) constant auxiliary space."
            }
        }
    },
    # 15. Merge Intervals
    {
        "id": "merge-intervals",
        "leetcode_num": 56,
        "title": "Merge Intervals",
        "difficulty": "Medium",
        "topic_id": "intervals",
        "official_url": "https://leetcode.com/problems/merge-intervals/",
        "summary": "Merge all overlapping intervals after sorting by start time.",
        "description": (
            "Given an array of `intervals` where `intervals[i] = [starti, endi]`, merge all overlapping intervals, "
            "and return an array of the non-overlapping intervals that cover all the intervals in the input."
        ),
        "constraints": [
            "1 <= intervals.length <= 10^4",
            "intervals[i].length == 2",
            "0 <= starti <= endi <= 10^4"
        ],
        "examples": [
            {
                "input": "intervals = [[1, 3], [2, 6], [8, 10], [15, 18]]",
                "output": "[[1, 6], [8, 10], [15, 18]]",
                "explanation": "Since intervals [1, 3] and [2, 6] overlap, merge them into [1, 6]."
            },
            {
                "input": "intervals = [[1, 4], [4, 5]]",
                "output": "[[1, 5]]",
                "explanation": "Intervals [1, 4] and [4, 5] are considered overlapping."
            }
        ],
        "starter_code": {
            "cpp": (
                "#include <vector>\n"
                "#include <algorithm>\n\n"
                "class Solution {\n"
                "public:\n"
                "    std::vector<std::vector<int>> merge(std::vector<std::vector<int>>& intervals) {\n"
                "        // TODO: Sort by start time and merge overlaps\n"
                "        return {};\n"
                "    }\n"
                "};\n"
            ),
            "python": (
                "class Solution:\n"
                "    def merge(self, intervals: list[list[int]]) -> list[list[int]]:\n"
                "        # TODO: Sort by start time and merge overlaps\n"
                "        return []\n"
            )
        },
        "solution_code": {
            "cpp": (
                "#include <vector>\n"
                "#include <algorithm>\n\n"
                "class Solution {\n"
                "public:\n"
                "    std::vector<std::vector<int>> merge(std::vector<std::vector<int>>& intervals) {\n"
                "        if (intervals.empty()) return {};\n"
                "        std::sort(intervals.begin(), intervals.end());\n"
                "        std::vector<std::vector<int>> merged;\n"
                "        merged.push_back(intervals[0]);\n"
                "        for (size_t i = 1; i < intervals.size(); ++i) {\n"
                "            if (intervals[i][0] <= merged.back()[1]) {\n"
                "                merged.back()[1] = std::max(merged.back()[1], intervals[i][1]);\n"
                "            } else {\n"
                "                merged.push_back(intervals[i]);\n"
                "            }\n"
                "        }\n"
                "        return merged;\n"
                "    }\n"
                "};\n"
            ),
            "python": (
                "class Solution:\n"
                "    def merge(self, intervals: list[list[int]]) -> list[list[int]]:\n"
                "        if not intervals:\n"
                "            return []\n"
                "        intervals.sort(key=lambda x: x[0])\n"
                "        merged = [intervals[0]]\n"
                "        for start, end in intervals[1:]:\n"
                "            if start <= merged[-1][1]:\n"
                "                merged[-1][1] = max(merged[-1][1], end)\n"
                "            else:\n"
                "                merged.append([start, end])\n"
                "        return merged\n"
            )
        },
        "test_cases": [
            {"input": "intervals = [[1, 3], [2, 6], [8, 10], [15, 18]]", "expected_output": "[[1, 6], [8, 10], [15, 18]]", "is_hidden": False},
            {"input": "intervals = [[1, 4], [4, 5]]", "expected_output": "[[1, 5]]", "is_hidden": False},
            {"input": "intervals = [[1, 4], [0, 4]]", "expected_output": "[[0, 4]]", "is_hidden": True}
        ],
        "structured_explanation": {
            "problem_understanding": "Two intervals [a, b] and [c, d] with a <= c overlap if and only if c <= b. Merging them produces [a, max(b, d)].",
            "approach": "Sort intervals by their start time. Iterate through the sorted list, comparing each interval with the last merged interval. If they overlap, expand the end boundary; otherwise append a new interval.",
            "pseudocode": "1. Sort intervals by start time\n2. merged = [intervals[0]]\n3. For interval in intervals[1:]:\n    If interval.start <= merged.last.end:\n        merged.last.end = max(merged.last.end, interval.end)\n    Else:\n        merged.append(interval)\n4. Return merged",
            "line_by_line": {
                "cpp": [
                    "std::sort(intervals.begin(), intervals.end()): Lexicographical sort by start time.",
                    "if (intervals[i][0] <= merged.back()[1]): Checks overlap with previous interval.",
                    "merged.back()[1] = std::max(merged.back()[1], intervals[i][1]): Merges by stretching end."
                ],
                "python": [
                    "intervals.sort(key=lambda x: x[0]): Orders intervals by starting point.",
                    "if start <= merged[-1][1]: Tests if current starts before previous ends.",
                    "merged[-1][1] = max(merged[-1][1], end): Extends end boundary."
                ]
            },
            "dry_run": [
                {"sorted": "[[1, 3], [2, 6], [8, 10], [15, 18]]", "merged": "[[1, 3]]"},
                {"compare": "[2, 6] with [1, 3]", "result": "overlap -> [[1, 6]]"},
                {"compare": "[8, 10] with [1, 6]", "result": "no overlap -> [[1, 6], [8, 10]]"}
            ],
            "complexity": {
                "time": "O(N log N) dominated by sorting the intervals.",
                "space": "O(N) to hold the output merged intervals."
            }
        }
    }
]

def get_all_topics() -> List[Dict[str, Any]]:
    return DSA_TOPICS

def get_topic_by_id(topic_id: str) -> Optional[Dict[str, Any]]:
    if not topic_id:
        return None
    tid = str(topic_id).lower().strip()
    for t in DSA_TOPICS:
        if t["id"] == tid:
            return t
    aliases = {
        "arrays-strings": "arrays",
        "stacks-queues": "stacks",
        "trees-bst": "trees",
        "two-pointers": "two-pointers-sliding-window",
        "sliding-window": "two-pointers-sliding-window",
        "priority-queues": "heaps",
        "heap": "heaps",
        "graph": "graphs",
        "tree": "trees",
        "stack": "stacks",
        "queue": "queues",
        "array": "arrays",
        "string": "strings",
        "dp": "dynamic-programming",
        "recursion": "recursion-backtracking",
        "backtracking": "recursion-backtracking",
        "interval": "intervals"
    }
    target = aliases.get(tid)
    if target:
        for t in DSA_TOPICS:
            if t["id"] == target:
                return t
    return None

def get_all_problems() -> List[Dict[str, Any]]:
    return LEETCODE_PROBLEMS

def get_problem_by_id(problem_id: str) -> Optional[Dict[str, Any]]:
    if not problem_id:
        return None
    pid = str(problem_id).lower().strip()
    for p in LEETCODE_PROBLEMS:
        if p["id"] == pid:
            return p
    return None

