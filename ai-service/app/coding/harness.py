"""
ORBIT AI — Test Harness Generator for LeetCode Problems.
Generates driver code for C++ and Python when user submits `class Solution`
without a standalone `main()` or CLI driver.
If the code already contains `main()` or standalone execution, it is left untouched.
"""

import re
from typing import Optional, Tuple, Dict, Any

def has_cpp_main(code: str) -> bool:
    """Checks whether C++ code contains a main function."""
    return bool(re.search(r'\bint\s+main\s*\(', code))

def has_python_entry(code: str) -> bool:
    """Checks whether Python code contains a main guard or direct execution call."""
    if "__name__" in code and "__main__" in code:
        return True
    # If code calls print() or input() outside classes/functions at root level
    lines = code.split("\n")
    for line in lines:
        stripped = line.strip()
        if stripped and not stripped.startswith("#"):
            if not line.startswith(" ") and not line.startswith("\t"):
                if stripped.startswith("print(") or stripped.startswith("input("):
                    return True
    return False

def generate_cpp_harness(problem_id: str, example_input: str) -> Optional[str]:
    """
    Generates a C++ main() function to execute class Solution for curated problems.
    """
    if problem_id == "two-sum":
        # e.g., nums = [2, 7, 11, 15], target = 9
        match_nums = re.search(r'nums\s*=\s*\[(.*?)\]', example_input)
        match_target = re.search(r'target\s*=\s*(-?\d+)', example_input)
        nums_str = match_nums.group(1) if match_nums else "2, 7, 11, 15"
        target_str = match_target.group(1) if match_target else "9"
        return f"""
#include <iostream>
#include <vector>

int main() {{
    Solution sol;
    std::vector<int> nums = {{{nums_str}}};
    int target = {target_str};
    std::vector<int> result = sol.twoSum(nums, target);
    std::cout << "[";
    for (size_t i = 0; i < result.size(); ++i) {{
        std::cout << result[i] << (i + 1 < result.size() ? ", " : "");
    }}
    std::cout << "]" << std::endl;
    return 0;
}}
"""
    elif problem_id == "best-time-to-buy-and-sell-stock":
        match_prices = re.search(r'prices\s*=\s*\[(.*?)\]', example_input)
        prices_str = match_prices.group(1) if match_prices else "7, 1, 5, 3, 6, 4"
        return f"""
#include <iostream>
#include <vector>

int main() {{
    Solution sol;
    std::vector<int> prices = {{{prices_str}}};
    int result = sol.maxProfit(prices);
    std::cout << result << std::endl;
    return 0;
}}
"""
    elif problem_id == "valid-anagram":
        match_s = re.search(r's\s*=\s*"([^"]*)"', example_input)
        match_t = re.search(r't\s*=\s*"([^"]*)"', example_input)
        s_val = match_s.group(1) if match_s else "anagram"
        t_val = match_t.group(1) if match_t else "nagaram"
        return f"""
#include <iostream>
#include <string>

int main() {{
    Solution sol;
    bool result = sol.isAnagram("{s_val}", "{t_val}");
    std::cout << (result ? "true" : "false") << std::endl;
    return 0;
}}
"""
    elif problem_id == "valid-parentheses":
        match_s = re.search(r's\s*=\s*"([^"]*)"', example_input)
        s_val = match_s.group(1) if match_s else "()"
        return f"""
#include <iostream>
#include <string>

int main() {{
    Solution sol;
    bool result = sol.isValid("{s_val}");
    std::cout << (result ? "true" : "false") << std::endl;
    return 0;
}}
"""
    elif problem_id == "binary-search":
        match_nums = re.search(r'nums\s*=\s*\[(.*?)\]', example_input)
        match_target = re.search(r'target\s*=\s*(-?\d+)', example_input)
        nums_str = match_nums.group(1) if match_nums else "-1, 0, 3, 5, 9, 12"
        target_str = match_target.group(1) if match_target else "9"
        return f"""
#include <iostream>
#include <vector>

int main() {{
    Solution sol;
    std::vector<int> nums = {{{nums_str}}};
    int target = {target_str};
    int result = sol.search(nums, target);
    std::cout << result << std::endl;
    return 0;
}}
"""
    elif problem_id == "climbing-stairs":
        match_n = re.search(r'n\s*=\s*(\d+)', example_input)
        n_val = match_n.group(1) if match_n else "2"
        return f"""
#include <iostream>

int main() {{
    Solution sol;
    int result = sol.climbStairs({n_val});
    std::cout << result << std::endl;
    return 0;
}}
"""
    elif problem_id == "reverse-linked-list":
        match_head = re.search(r'head\s*=\s*\[(.*?)\]', example_input)
        vals_str = match_head.group(1).strip() if match_head else "1, 2, 3, 4, 5"
        return f"""
#include <iostream>
#include <vector>

int main() {{
    std::vector<int> vals = {{{vals_str}}};
    ListNode* dummy = new ListNode(0);
    ListNode* curr = dummy;
    for (int v : vals) {{
        curr->next = new ListNode(v);
        curr = curr->next;
    }}
    Solution sol;
    ListNode* rev = sol.reverseList(dummy->next);
    std::cout << "[";
    while (rev) {{
        std::cout << rev->val << (rev->next ? ", " : "");
        rev = rev->next;
    }}
    std::cout << "]" << std::endl;
    return 0;
}}
"""
    elif problem_id == "container-with-most-water":
        match_h = re.search(r'height\s*=\s*\[(.*?)\]', example_input)
        h_str = match_h.group(1) if match_h else "1, 8, 6, 2, 5, 4, 8, 3, 7"
        return f"""
#include <iostream>
#include <vector>

int main() {{
    Solution sol;
    std::vector<int> height = {{{h_str}}};
    int result = sol.maxArea(height);
    std::cout << result << std::endl;
    return 0;
}}
"""
    elif problem_id == "kth-largest-element-in-an-array":
        match_nums = re.search(r'nums\s*=\s*\[(.*?)\]', example_input)
        match_k = re.search(r'k\s*=\s*(\d+)', example_input)
        nums_str = match_nums.group(1) if match_nums else "3, 2, 1, 5, 6, 4"
        k_str = match_k.group(1) if match_k else "2"
        return f"""
#include <iostream>
#include <vector>

int main() {{
    Solution sol;
    std::vector<int> nums = {{{nums_str}}};
    int k = {k_str};
    int result = sol.findKthLargest(nums, k);
    std::cout << result << std::endl;
    return 0;
}}
"""
    elif problem_id == "jump-game":
        match_nums = re.search(r'nums\s*=\s*\[(.*?)\]', example_input)
        nums_str = match_nums.group(1) if match_nums else "2, 3, 1, 1, 4"
        return f"""
#include <iostream>
#include <vector>

int main() {{
    Solution sol;
    std::vector<int> nums = {{{nums_str}}};
    bool result = sol.canJump(nums);
    std::cout << (result ? "true" : "false") << std::endl;
    return 0;
}}
"""
    elif problem_id == "subsets":
        match_nums = re.search(r'nums\s*=\s*\[(.*?)\]', example_input)
        nums_str = match_nums.group(1) if match_nums else "1, 2, 3"
        return f"""
#include <iostream>
#include <vector>

int main() {{
    Solution sol;
    std::vector<int> nums = {{{nums_str}}};
    std::vector<std::vector<int>> res = sol.subsets(nums);
    std::cout << "[";
    for (size_t i = 0; i < res.size(); ++i) {{
        std::cout << "[";
        for (size_t j = 0; j < res[i].size(); ++j) {{
            std::cout << res[i][j] << (j + 1 < res[i].size() ? ", " : "");
        }}
        std::cout << "]" << (i + 1 < res.size() ? ", " : "");
    }}
    std::cout << "]" << std::endl;
    return 0;
}}
"""
    elif problem_id == "merge-intervals":
        return f"""
#include <iostream>
#include <vector>

int main() {{
    Solution sol;
    std::vector<std::vector<int>> intervals = {{{{1, 3}}, {{2, 6}}, {{8, 10}}, {{15, 18}}}};
    std::vector<std::vector<int>> res = sol.merge(intervals);
    std::cout << "[";
    for (size_t i = 0; i < res.size(); ++i) {{
        std::cout << "[" << res[i][0] << ", " << res[i][1] << "]" << (i + 1 < res.size() ? ", " : "");
    }}
    std::cout << "]" << std::endl;
    return 0;
}}
"""
    return None

def generate_python_harness(problem_id: str, example_input: str) -> Optional[str]:
    """
    Generates a Python driver block to execute class Solution for curated problems.
    """
    if problem_id == "two-sum":
        match_nums = re.search(r'nums\s*=\s*\[(.*?)\]', example_input)
        match_target = re.search(r'target\s*=\s*(-?\d+)', example_input)
        nums_str = match_nums.group(1) if match_nums else "2, 7, 11, 15"
        target_str = match_target.group(1) if match_target else "9"
        return f"""
if __name__ == '__main__':
    import json
    sol = Solution()
    res = sol.twoSum([{nums_str}], {target_str})
    print(json.dumps(res))
"""
    elif problem_id == "best-time-to-buy-and-sell-stock":
        match_prices = re.search(r'prices\s*=\s*\[(.*?)\]', example_input)
        prices_str = match_prices.group(1) if match_prices else "7, 1, 5, 3, 6, 4"
        return f"""
if __name__ == '__main__':
    sol = Solution()
    res = sol.maxProfit([{prices_str}])
    print(res)
"""
    elif problem_id == "valid-anagram":
        match_s = re.search(r's\s*=\s*"([^"]*)"', example_input)
        match_t = re.search(r't\s*=\s*"([^"]*)"', example_input)
        s_val = match_s.group(1) if match_s else "anagram"
        t_val = match_t.group(1) if match_t else "nagaram"
        return f"""
if __name__ == '__main__':
    sol = Solution()
    res = sol.isAnagram("{s_val}", "{t_val}")
    print("true" if res else "false")
"""
    elif problem_id == "valid-parentheses":
        match_s = re.search(r's\s*=\s*"([^"]*)"', example_input)
        s_val = match_s.group(1) if match_s else "()"
        return f"""
if __name__ == '__main__':
    sol = Solution()
    res = sol.isValid("{s_val}")
    print("true" if res else "false")
"""
    elif problem_id == "binary-search":
        match_nums = re.search(r'nums\s*=\s*\[(.*?)\]', example_input)
        match_target = re.search(r'target\s*=\s*(-?\d+)', example_input)
        nums_str = match_nums.group(1) if match_nums else "-1, 0, 3, 5, 9, 12"
        target_str = match_target.group(1) if match_target else "9"
        return f"""
if __name__ == '__main__':
    sol = Solution()
    res = sol.search([{nums_str}], {target_str})
    print(res)
"""
    elif problem_id == "climbing-stairs":
        match_n = re.search(r'n\s*=\s*(\d+)', example_input)
        n_val = match_n.group(1) if match_n else "2"
        return f"""
if __name__ == '__main__':
    sol = Solution()
    res = sol.climbStairs({n_val})
    print(res)
"""
    elif problem_id == "reverse-linked-list":
        match_head = re.search(r'head\s*=\s*\[(.*?)\]', example_input)
        vals_str = match_head.group(1).strip() if match_head else "1, 2, 3, 4, 5"
        return f"""
if __name__ == '__main__':
    import json
    vals = [{vals_str}]
    class Node:
        def __init__(self, val=0, next=None):
            self.val = val
            self.next = next
    # If student used ListNode
    ListNode = globals().get('ListNode', Node)
    dummy = ListNode(0)
    curr = dummy
    for v in vals:
        curr.next = ListNode(v)
        curr = curr.next
    sol = Solution()
    rev = sol.reverseList(dummy.next)
    out = []
    while rev:
        out.append(rev.val)
        rev = rev.next
    print(json.dumps(out))
"""
    elif problem_id == "container-with-most-water":
        match_h = re.search(r'height\s*=\s*\[(.*?)\]', example_input)
        h_str = match_h.group(1) if match_h else "1, 8, 6, 2, 5, 4, 8, 3, 7"
        return f"""
if __name__ == '__main__':
    sol = Solution()
    res = sol.maxArea([{h_str}])
    print(res)
"""
    elif problem_id == "kth-largest-element-in-an-array":
        match_nums = re.search(r'nums\s*=\s*\[(.*?)\]', example_input)
        match_k = re.search(r'k\s*=\s*(\d+)', example_input)
        nums_str = match_nums.group(1) if match_nums else "3, 2, 1, 5, 6, 4"
        k_str = match_k.group(1) if match_k else "2"
        return f"""
if __name__ == '__main__':
    sol = Solution()
    res = sol.findKthLargest([{nums_str}], {k_str})
    print(res)
"""
    elif problem_id == "jump-game":
        match_nums = re.search(r'nums\s*=\s*\[(.*?)\]', example_input)
        nums_str = match_nums.group(1) if match_nums else "2, 3, 1, 1, 4"
        return f"""
if __name__ == '__main__':
    sol = Solution()
    res = sol.canJump([{nums_str}])
    print("true" if res else "false")
"""
    elif problem_id == "subsets":
        match_nums = re.search(r'nums\s*=\s*\[(.*?)\]', example_input)
        nums_str = match_nums.group(1) if match_nums else "1, 2, 3"
        return f"""
if __name__ == '__main__':
    import json
    sol = Solution()
    res = sol.subsets([{nums_str}])
    print(json.dumps(res))
"""
    elif problem_id == "merge-intervals":
        return f"""
if __name__ == '__main__':
    import json
    sol = Solution()
    res = sol.merge([[1, 3], [2, 6], [8, 10], [15, 18]])
    print(json.dumps(res))
"""
    return None

def prepare_code(language: str, code: str, problem_id: Optional[str] = None, example_input: Optional[str] = None) -> str:
    """
    Inspects user code and prepares it for container execution.
    If it's already a complete standalone program with its own main, returns code as-is.
    If it's a LeetCode class Solution without main, appends the appropriate driver harness.
    """
    if language == "cpp":
        if has_cpp_main(code):
            return code
        if problem_id and example_input:
            harness = generate_cpp_harness(problem_id, example_input)
            if harness:
                return code + "\n\n" + harness
        return code

    elif language == "python":
        if has_python_entry(code):
            return code
        if problem_id and example_input:
            harness = generate_python_harness(problem_id, example_input)
            if harness:
                return code + "\n\n" + harness
        return code

    return code
